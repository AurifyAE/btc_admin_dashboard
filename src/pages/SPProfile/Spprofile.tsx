import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '../../store';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useEffect, useState } from 'react';
import IconMail from '../../components/Icon/IconMail';
import IconPhone from '../../components/Icon/IconPhone';
import IconInfoCircle from '../../components/Icon/IconInfoCircle';
import IconMapPin from '../../components/Icon/IconMapPin';
import axios from 'axios';
import { Package, Clock, RotateCcw, TrendingUp, ArrowRight, Eye, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Profile = () => {
    const { id: paramId } = useParams(); // Get the ID from URL parameters
    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    const dispatch = useDispatch();
    const backendUrl = import.meta.env.VITE_API_URL;
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [salesperson, setSalesperson] = useState<any>(null);
    const [soldProducts, setSoldProducts] = useState<any[]>([]);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl' ? true : false;

    const totalItems = soldProducts.reduce((total, product) => {
        return total + (product.items?.length || 0);
    }, 0);

    useEffect(() => {
        // Check if user is either a salesperson or an admin
        if (!token || (userRole !== 'salesperson' && userRole !== 'admin')) {
            navigate('/auth/cover-login');
            return;
        }
    }, [navigate, token, userRole]);

    const fetchUserById = async (userId: any) => {
        if (!userId) {
            console.error('User ID is undefined or empty');
            return;
        }

        try {
            const response = await axios.get(`${backendUrl}/salesperson/get-sales-person/${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setSalesperson(response.data.salesperson);
            setSoldProducts(response.data.salesperson.selledProducts || []);
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    // First useEffect to handle initialization and navigation
    useEffect(() => {
        dispatch(setPageTitle('Profile'));

        // If we have a parameter ID, use that (admin viewing a salesperson's profile)
        if (paramId) {
            fetchUserById(paramId);
        } else {
            // Otherwise, use logged-in user's data (salesperson viewing own profile)
            try {
                const userData = localStorage.getItem('userData');
                if (userData) {
                    const parsedData = JSON.parse(userData);
                    setData(parsedData);
                } else {
                    console.error('No user data found in localStorage');
                }
            } catch (err) {
                console.error('Error parsing user data from localStorage:', err);
            }
        }
    }, [dispatch, paramId]);

    // Second useEffect to handle data fetching after state is updated
    // Only run this when there's no paramId (for logged-in user viewing their own profile)
    useEffect(() => {
        if (!paramId && data && data.id) {
            fetchUserById(data.id);
        }
    }, [data, paramId]);

    // Function to generate invoice PDF
    const generateInvoicePDF = async (invoiceData: any) => {
        setGeneratingPdf(true);
        try {
            const doc = new jsPDF();

            // Set font
            doc.setFont('helvetica');

            // Company Header
            doc.setFontSize(20);
            doc.text('BTC', doc.internal.pageSize.width / 2, 20, { align: 'center' });
            doc.setFontSize(10);
            doc.text('123 Business Street, City, Country', doc.internal.pageSize.width / 2, 27, { align: 'center' });
            doc.text('Phone: (123) 456-7890 | Email: info@company.com', doc.internal.pageSize.width / 2, 32, { align: 'center' });

            // Invoice Details
            doc.setFontSize(16);
            doc.text('Invoice', 20, 45);
            doc.setLineWidth(0.5);
            doc.line(20, 47, 50, 47);

            doc.setFontSize(10);
            doc.text(`Invoice Number: ${invoiceData.invoiceNumber}`, 20, 55);

            const date = new Date(invoiceData.invoiceDate);
            const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
            doc.text(`Date: ${formattedDate}`, 20, 60);

            // Customer Details with proper validation
            doc.setFontSize(12);
            doc.text('Customer Details', 20, 70);
            doc.setFontSize(10);

            const customerDetails = [];
            if (invoiceData.user) {
                customerDetails.push(`Name: ${invoiceData.user.name || invoiceData.userName || 'N/A'}`);
                customerDetails.push(`Email: ${invoiceData.user.email || invoiceData.userEmail || 'N/A'}`);
                customerDetails.push(`Phone: ${invoiceData.user.phone || invoiceData.userPhone || 'N/A'}`);
                if (invoiceData.user.location || invoiceData.userLocation) {
                    customerDetails.push(`Address: ${invoiceData.user.location || invoiceData.userLocation}`);
                }
            } else {
                customerDetails.push(`Name: ${invoiceData.userName || 'N/A'}`);
                customerDetails.push(`Email: ${invoiceData.userEmail || 'N/A'}`);
                customerDetails.push(`Phone: ${invoiceData.userPhone || 'N/A'}`);
                customerDetails.push(`Address: ${invoiceData.userLocation || 'N/A'}`);
            }

            let customerY = 77;
            customerDetails.forEach((detail) => {
                doc.text(detail, 20, customerY);
                customerY += 5;
            });

            // Table Data: Use all items with proper validation
            const items = Array.isArray(invoiceData.items) ? invoiceData.items : [];
            const itemsTableData: any[] = [];

            items.forEach((item: any) => {
                // Ensure values are properly defined and converted to numbers
                const itemName = item.description || 'Unnamed Item';
                const grossWeight = Number(item.gross_weight) || 0;
                const stoneWeight = Number(item.stone_weight) || 0;
                const netWeight = Number(item.net_weight) || 0;
                const pureWeight = Number(item.pure_weight) || 0;
                const pureGoldRate = (invoiceData.goldRate / 31.103) * pureWeight;
                const mkgRate = Number(item.mkg_rate) || 0;
                const mkgAmount = Number(item.mkg_amount) || 0;

                itemsTableData.push([
                    itemName,
                    Number(grossWeight).toFixed(2),
                    Number(stoneWeight).toFixed(2),
                    Number(netWeight).toFixed(2),
                    Number(pureWeight).toFixed(2),
                    Number(pureGoldRate).toFixed(2),
                    Number(mkgRate).toFixed(2),
                    Number(mkgAmount).toFixed(2),
                    (Number(pureGoldRate) + Number(mkgRate) + Number(mkgAmount)).toFixed(2), // Net Amount
                ]);
            });

            // Items Table with comprehensive column structure
            autoTable(doc, {
                startY: 100,
                head: [['Item', 'Gross', 'Stone', 'Net', 'Pure', 'Pure gold Rate', 'MKG Rate', 'MKG Amt', 'Net Amt']],
                body: itemsTableData,
                theme: 'plain',
                headStyles: {
                    fillColor: [240, 240, 240],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    fontSize: 7,
                },
                styles: { fontSize: 7 }, // Reduced font size to fit all columns
                columnStyles: {
                    0: { cellWidth: 45 }, // Item - reduced width
                    1: { cellWidth: 20, halign: 'center' }, // Gross Weight
                    2: { cellWidth: 20, halign: 'center' }, // Stone Weight
                    3: { cellWidth: 20, halign: 'center' }, // Net Weight
                    4: { cellWidth: 20, halign: 'center' }, // Pure Weight
                    5: { cellWidth: 20, halign: 'center' }, // Pure Gold Rate
                    6: { cellWidth: 20, halign: 'center' }, // MKG Rate
                    7: { cellWidth: 20, halign: 'center' }, // MKG Amount
                    8: { cellWidth: 20, halign: 'right' }, // Net Amount
                },
                margin: { left: 5, right: 5 }, // Reduced margins to fit all columns
            });

            const finalY = (doc as any).lastAutoTable.finalY + 10;

            // Totals with proper validation
            let yPos = finalY;
            const totalsX = 130;
            const valuesX = 190;

            // Ensure all values are numbers before using toFixed
            const subtotalValue = Number(invoiceData.totals?.subtotal || invoiceData.subtotal || invoiceData.total) || 0;
            const taxValue = Number(invoiceData.totals?.taxAmount || 0);
            const discountValue = Number(invoiceData.totals?.discountAmount || 0);
            const totalValue = Number(invoiceData.totals?.total || invoiceData.total) || 0;

            // If tax/discount amounts aren't pre-calculated, calculate them
            const tax = Number(invoiceData.tax || 0);
            const discount = Number(invoiceData.discount || 0);
            const calculatedTaxAmount = taxValue || (subtotalValue * tax) / 100;
            const calculatedDiscountAmount = discountValue || (subtotalValue * discount) / 100;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            // Subtotal
            doc.text('Subtotal:', totalsX, yPos, { align: 'right' });
            doc.text(`$${subtotalValue.toFixed(2)}`, valuesX, yPos, { align: 'right' });
            yPos += 6;

            // Tax - Always show tax (even if 0)
            doc.text(`Tax (${tax}%):`, totalsX, yPos, { align: 'right' });
            doc.text(`$${calculatedTaxAmount.toFixed(2)}`, valuesX, yPos, { align: 'right' });
            yPos += 6;

            // Discount - Always show discount (even if 0)
            doc.text(`Discount (${discount}%):`, totalsX, yPos, { align: 'right' });
            doc.text(`-$${calculatedDiscountAmount.toFixed(2)}`, valuesX, yPos, { align: 'right' });
            yPos += 6;

            // Shipping rate if applicable
            if (invoiceData.shippingRate && invoiceData.shippingRate > 0) {
                doc.text('Shipping:', totalsX, yPos, { align: 'right' });
                doc.text(`$${Number(invoiceData.shippingRate).toFixed(2)}`, valuesX, yPos, { align: 'right' });
                yPos += 6;
            }

            // Draw a line before final total
            doc.setLineWidth(0.5);
            doc.line(totalsX - 20, yPos, valuesX + 10, yPos);
            yPos += 5;

            // Final Total
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Total:', totalsX, yPos, { align: 'right' });
            doc.text(`$${totalValue.toFixed(2)}`, valuesX, yPos, { align: 'right' });
            doc.setFont('helvetica', 'normal');

            // Additional information
            yPos += 15;
            doc.setFontSize(10);

            // Add gold rate if applicable
            if (invoiceData.goldRate) {
                doc.text(`Gold Rate: $${Number(invoiceData.goldRate).toFixed(2)}/oz`, 20, yPos);
                yPos += 6;
            }

            // Add salesperson if available
            if (salesperson) {
                doc.text(`Sold by: ${salesperson.name || 'N/A'}`, 20, yPos);
                yPos += 6;
            }

            // Save the PDF
            doc.save(`Invoice_${invoiceData.invoiceNumber}.pdf`);

            return true;
        } catch (error) {
            console.error('Error generating PDF:', error);
            return false;
        } finally {
            setGeneratingPdf(false);
        }
    };

    // Function to handle viewing invoice details
    const handleViewInvoice = (invoice: any) => {
        setSelectedInvoice(invoice);
        setShowModal(true);
    };

    // Function to close modal
    const closeModal = () => {
        setShowModal(false);
        setSelectedInvoice(null);
    };

    // Helper function to render product lists
    const renderProductList = (products: any[], emptyMessage: string) => {
        if (!products || products.length === 0) {
            return <div className="p-4 text-center text-gray-500 dark:text-gray-400">{emptyMessage || 'No products available'}</div>;
        }

        return (
            <div className="table-responsive">
                <table className="table-striped w-full">
                    <thead>
                        <tr>
                            <th className="px-4 py-2 text-left">Description</th>
                            <th className="px-4 py-2 text-left">Stock Code</th>
                            <th className="px-4 py-2 text-left">Gross Weight</th>
                            <th className="px-4 py-2 text-left">Pure Weight</th>
                            <th className="px-4 py-2 text-left">MKG Rate</th>
                            <th className="px-4 py-2 text-left">MKG Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((item, index) => (
                            <tr key={index}>
                                <td className="px-4 py-2">{item.productId?.description || 'N/A'}</td>
                                <td className="px-4 py-2">{item.productId?.stock_code || 'N/A'}</td>
                                <td className="px-4 py-2">{item.productId?.gross_weight || 'N/A'}</td>
                                <td className="px-4 py-2">{item.productId?.pure_weight || 'N/A'}</td>
                                <td className="px-4 py-2">{item.productId?.mkg_rate || 'N/A'}</td>
                                <td className="px-4 py-2">{item.productId?.mkg_amount || 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    // Helper function to render sold products list (with different structure)
    const renderSoldProductList = (products: any[], emptyMessage: string) => {
        if (!products || products.length === 0) {
            return <div className="p-4 text-center text-gray-500 dark:text-gray-400">{emptyMessage || 'No products available'}</div>;
        }

        return (
            <div className="table-responsive">
                <table className="table-striped w-full">
                    <thead>
                        <tr>
                            <th className="px-4 py-2 text-left">Invoice Number</th>
                            <th className="px-4 py-2 text-left">Date</th>
                            <th className="px-4 py-2 text-left">Total</th>
                            <th className="px-4 py-2 text-left">Customer</th>
                            <th className="px-4 py-2 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((item, index) => (
                            <tr key={index}>
                                <td className="px-4 py-2">{item.invoiceNumber || 'N/A'}</td>
                                <td className="px-4 py-2">
                                    {item.invoiceDate ? (typeof item.invoiceDate === 'string' ? new Date(item.invoiceDate).toLocaleString('en-GB') : item.invoiceDate.toLocaleString('en-GB')) : 'N/A'}
                                </td>
                                <td className="px-4 py-2">{typeof item.total === 'number' ? item.total.toFixed(2) : item.total ? Number(item.total).toFixed(2) : 'N/A'} USD</td>
                                <td className="px-4 py-2">{item.userName || 'N/A'}</td>
                                <td className="px-4 py-2">
                                    <button
                                        onClick={() => handleViewInvoice(item)}
                                        className="flex items-center gap-1 px-3 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-md transition-colors duration-200"
                                    >
                                        <Eye className="w-4 h-4" />
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div>
            <div className="pt-5">
                {/* Profile and Product Information Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-5">
                    {/* Salesperson Profile Panel */}
                    <div className="panel">
                        <div className="flex items-center justify-between mb-5">
                            <h5 className="font-semibold text-lg dark:text-white-light">Profile</h5>
                        </div>
                        <div className="mb-5">
                            <div className="flex flex-col justify-center items-center">
                                {salesperson?.image?.url ? (
                                    <img src={salesperson.image.url} alt="Profile" className="w-24 h-24 rounded-full object-cover mb-5" />
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-5">
                                        <span className="text-white text-2xl font-bold">{salesperson?.name?.charAt(0) || 'U'}</span>
                                    </div>
                                )}{' '}
                                <p className="font-semibold text-primary text-xl">{salesperson?.name || 'Loading...'}</p>
                            </div>
                            <ul className="mt-5 flex flex-col max-w-[200px] m-auto space-y-4 font-semibold text-white-dark">
                                <li className="flex items-center gap-2">
                                    <IconInfoCircle className="shrink-0" />
                                    {salesperson?.salespersonId || 'Loading...'}
                                </li>
                                <li>
                                    <div className="flex items-center gap-2">
                                        <IconMail className="w-5 h-5 shrink-0" />
                                        <span className="text-primary truncate">{salesperson?.email || 'Loading...'}</span>
                                    </div>
                                </li>
                                <li className="flex items-center gap-2">
                                    <IconPhone />
                                    <span className="whitespace-nowrap" dir="ltr">
                                        {salesperson?.phone || 'Loading...'}
                                    </span>
                                </li>
                                {salesperson?.assignedLocation && (
                                    <li className="flex items-center gap-2">
                                        <IconMapPin />
                                        <span className="whitespace-nowrap">{salesperson.assignedLocation.locationName || 'No location assigned'}</span>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>

                    {userRole === 'admin' ? (
                        <div className="panel lg:col-span-2 xl:col-span-3">
                            <div className="mb-5 flex items-center justify-between">
                                <h5 className="font-semibold text-lg dark:text-white-light">Products Overview</h5>
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span>Live Updates</span>
                                </div>
                            </div>
                            <div className="mb-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                                {[
                                    {
                                        title: 'Assigned Products',
                                        value: salesperson?.assignedProducts?.length || 0,
                                        icon: Package,
                                        bg: 'bg-blue-50 dark:bg-blue-900/20',
                                        iconColor: 'text-blue-600 dark:text-blue-400',
                                    },
                                    {
                                        title: 'Pending Products',
                                        value: salesperson?.pendingProducts?.length || 0,
                                        icon: Clock,
                                        bg: 'bg-amber-50 dark:bg-amber-900/20',
                                        iconColor: 'text-amber-600 dark:text-amber-400',
                                    },
                                    {
                                        title: 'Return Applied',
                                        value: salesperson?.returnAppliedProducts?.length || 0,
                                        icon: RotateCcw,
                                        bg: `bg-red-50 dark:bg-red-900/20${salesperson?.returnAppliedProducts?.length > 0 ? ' cursor-pointer' : ''}`,
                                        iconColor: 'text-red-600 dark:text-red-400',
                                        route: salesperson?.returnAppliedProducts?.length > 0 ? '/returncartofadmin' : undefined,
                                    },
                                    {
                                        title: 'Sold Products',
                                        value: totalItems || 0,
                                        icon: TrendingUp,
                                        bg: 'bg-green-50 dark:bg-green-900/20',
                                        iconColor: 'text-green-600 dark:text-green-400',
                                    },
                                ].map((card, idx) => {
                                    const Icon = card.icon;
                                    return (
                                        <div key={idx} className={`${card.bg} rounded-xl p-4  flex flex-col items-start  transition`} onClick={() => card.route && navigate(card.route)}>
                                            <div className={`mb-2 p-2 rounded-lg ${card.bg}`}>
                                                <Icon className={`w-5 h-5 ${card.iconColor}`} />
                                            </div>
                                            <span className="text-base font-medium mb-1">{card.title}</span>
                                            <p className="text-2xl font-bold">{card.value.toLocaleString()}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="panel lg:col-span-2 xl:col-span-3">
                            <div className="mb-5 flex items-center justify-between">
                                <h5 className="font-semibold text-lg dark:text-white-light">Products Overview</h5>
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span>Live Updates</span>
                                </div>
                            </div>
                            <div className="mb-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                                {[
                                    {
                                        title: 'Assigned Products',
                                        value: salesperson?.assignedProducts?.length || 0,
                                        icon: Package,
                                        bg: 'bg-blue-50 dark:bg-blue-900/20',
                                        iconColor: 'text-blue-600 dark:text-blue-400',
                                        route: '/productinhand',
                                    },
                                    {
                                        title: 'Pending Products',
                                        value: salesperson?.pendingProducts?.length || 0,
                                        icon: Clock,
                                        bg: 'bg-amber-50 dark:bg-amber-900/20',
                                        iconColor: 'text-amber-600 dark:text-amber-400',
                                        route: '/incomingproducts',
                                    },
                                    {
                                        title: 'Return Applied',
                                        value: salesperson?.returnAppliedProducts?.length || 0,
                                        icon: RotateCcw,
                                        bg: 'bg-red-50 dark:bg-red-900/20',
                                        iconColor: 'text-red-600 dark:text-red-400',
                                        route: '/returncart',
                                    },
                                    {
                                        title: 'Sold Products',
                                        value: totalItems || 0,
                                        icon: TrendingUp,
                                        bg: 'bg-green-50 dark:bg-green-900/20',
                                        iconColor: 'text-green-600 dark:text-green-400',
                                        route: '/soldpageofsalesperson',
                                    },
                                ].map((card, idx) => {
                                    const Icon = card.icon;
                                    return (
                                        <div key={idx} className={`${card.bg} rounded-xl p-4 cursor-pointer flex flex-col items-start hover:shadow-md transition`} onClick={() => navigate(card.route)}>
                                            <div className={`mb-2 p-2 rounded-lg ${card.bg}`}>
                                                <Icon className={`w-5 h-5 ${card.iconColor}`} />
                                            </div>
                                            <span className="text-base font-medium mb-1">{card.title}</span>
                                            <p className="text-2xl font-bold">{card.value.toLocaleString()}</p>
                                            <ArrowRight className="w-4 h-4 mt-2 text-gray-400" />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Product Details Sections */}
                <div className="grid grid-cols-1 gap-5">
                    {/* Assigned Products Section */}
                    <div className="panel">
                        <div className="flex items-center justify-between mb-5">
                            <h5 className="font-semibold text-lg dark:text-white-light">Assigned Products</h5>
                        </div>
                        {renderProductList(salesperson?.assignedProducts, 'No products have been assigned yet.')}
                    </div>

                    {/* Pending Products Section */}
                    <div className="panel">
                        <div className="flex items-center justify-between mb-5">
                            <h5 className="font-semibold text-lg dark:text-white-light">Pending Products</h5>
                        </div>
                        {renderProductList(salesperson?.pendingProducts, 'No pending products.')}
                    </div>

                    {/* Return Applied Products Section */}
                    <div className="panel">
                        <div className="flex items-center justify-between mb-5">
                            <h5 className="font-semibold text-lg dark:text-white-light">Return Applied Products</h5>
                        </div>
                        {renderProductList(salesperson?.returnAppliedProducts, 'No return applications.')}
                    </div>

                    {/* Sold Products Section */}
                    <div className="panel">
                        <div className="flex items-center justify-between mb-5">
                            <h5 className="font-semibold text-lg dark:text-white-light">Sold</h5>
                        </div>
                        {renderSoldProductList(salesperson?.selledProducts, 'No products have been sold yet.')}
                    </div>
                </div>
            </div>

            {/* Invoice Details Modal */}
            {showModal && selectedInvoice && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Invoice Details - {selectedInvoice.invoiceNumber}</h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            {/* Invoice Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="space-y-3">
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Invoice Information</h4>
                                    <div className="space-y-2">
                                        <p>
                                            <span className="font-medium">Invoice Number:</span> {selectedInvoice.invoiceNumber || 'N/A'}
                                        </p>
                                        <p>
                                            <span className="font-medium">Date:</span> {selectedInvoice.invoiceDate ? new Date(selectedInvoice.invoiceDate).toLocaleString('en-GB') : 'N/A'}
                                        </p>
                                        <p>
                                            <span className="font-medium">Gold Rate:</span> ${selectedInvoice.goldRate || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Customer Information</h4>
                                    <div className="space-y-2">
                                        <p>
                                            <span className="font-medium">Name:</span> {selectedInvoice.userName || 'N/A'}
                                        </p>
                                        <p>
                                            <span className="font-medium">Email:</span> {selectedInvoice.userEmail || 'N/A'}
                                        </p>
                                        <p>
                                            <span className="font-medium">Phone:</span> {selectedInvoice.userPhone || 'N/A'}
                                        </p>
                                        <p>
                                            <span className="font-medium">Location:</span> {selectedInvoice.userLocation || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="mb-6">
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Items</h4>
                                {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full border border-gray-200 dark:border-gray-700">
                                            <thead className="bg-gray-50 dark:bg-gray-700">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Product ID</th>
                                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Stock Code</th>
                                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Description</th>
                                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Gross Rate</th>
                                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Stone Weight</th>
                                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Net Weight</th>
                                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Pure Weight</th>
                                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">MKG Rate</th>
                                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">MKG Amount</th>
                                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Pure Rate</th>
                                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Net Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                {selectedInvoice.items.map((item: any, index: number) => (
                                                    <tr key={index} className="bg-white dark:bg-gray-800">
                                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.productId || 'N/A'}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.stock_code || 'N/A'}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.description || 'N/A'}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">${item.gross_rate?.toFixed(2) || 'N/A'}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.stone_weight || 'N/A'}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.net_weight || 'N/A'}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.pure_weight || 'N/A'}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">${item.mkg_rate?.toFixed(2) || 'N/A'}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">${item.mkg_amount?.toFixed(2) || 'N/A'}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">${item.pure_rate?.toFixed(2) || 'N/A'}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">${item.net_amount?.toFixed(2) || 'N/A'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400">No items found in this invoice.</p>
                                )}
                            </div>

                            {/* Financial Summary */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Financial Summary</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Subtotal</p>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">${selectedInvoice.subtotal?.toFixed(2) || '0.00'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Tax</p>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">${selectedInvoice.tax?.toFixed(2) || '0.00'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Discount</p>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">${selectedInvoice.discount?.toFixed(2) || '0.00'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                                        <p className="text-xl font-bold text-green-600 dark:text-green-400">${selectedInvoice.total?.toFixed(2) || '0.00'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700 space-x-2">
                            <button
                                onClick={() => generateInvoicePDF(selectedInvoice)}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors duration-200"
                                disabled={generatingPdf}
                            >
                                {generatingPdf ? 'Generating...' : 'Download PDF'}
                            </button>
                            <button onClick={closeModal} className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors duration-200">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
