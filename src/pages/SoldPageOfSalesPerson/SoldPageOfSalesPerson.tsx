import { DataTable } from 'mantine-datatable';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Salesperson {
    selledProducts?: any[]; // Replace 'any' with a more specific type if possible
    // other properties if they exist
}

const SoldProducts = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    // States
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [recordsData, setRecordsData] = useState([]);
    const [salesperson, setSalesperson] = useState<Salesperson | null>(null);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generatingPdf, setGeneratingPdf] = useState(false);
    
    // Get stored tokens and configuration
    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    const backendUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
        if (!token || userRole !== 'salesperson') {
            navigate('/auth/cover-login');
            return;
        }
        
    }, [navigate]);
    
    const fetchUserById = async (userId:any) => {
        if (!userId) {
            console.error('User ID is undefined or empty');
            return;
        }
        
        setLoading(true);
        try {
            const response = await axios.get(`${backendUrl}/salesperson/get-sales-person/${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            
            setSalesperson(response.data.salesperson);
            
            // If salesperson has sold products, set them as records data
            if (response.data.salesperson?.selledProducts?.length) {
                setRecordsData(response.data.salesperson.selledProducts);
            }
            
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setLoading(false);
        }
    };
    
    // Handle initialization and navigation
    useEffect(() => {
        dispatch(setPageTitle('Sold Products'));
        
      
        
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
    }, [navigate, dispatch, token, userRole]);
    
    // Handle data fetching after state is updated
    useEffect(() => {
        if (data && (data as { id: string }).id) {
            fetchUserById((data as { id: string }).id);
        }
    }, [data]);
    
    // Handle pagination
    useEffect(() => {
        setPage(1);
    }, [pageSize]);
    
    useEffect(() => {
        if ((salesperson as any)?.selledProducts?.length) {
          const from = (page - 1) * pageSize;
          const to = from + pageSize;
          setRecordsData((salesperson as any).selledProducts.slice(from, to));
        }
    }, [page, pageSize, salesperson]);
    
    // Format date to a readable string
    const formatDate = (dateString:any) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };
    
    // Format currency
    const formatCurrency = (amount:any) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    // Generate invoice PDF for a specific product
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
    
            // Customer Details
            doc.setFontSize(12);
            doc.text('Customer Details', 20, 70);
            doc.setFontSize(10);
            const customerDetails = [
                `Name: ${invoiceData.userName || 'N/A'}`,
                `Email: ${invoiceData.userEmail || 'N/A'}`,
                `Phone: ${invoiceData.userPhone || 'N/A'}`,
                `Address: ${invoiceData.userLocation || 'N/A'}`,
            ];
            let customerY = 77;
            customerDetails.forEach(detail => {
                doc.text(detail, 20, customerY);
                customerY += 5;
            });
    
            // // Salesperson Details
            // doc.setFontSize(12);
            // doc.text('Salesperson Details', 120, 70);
            // doc.setFontSize(10);
    
            // const salespersonData = invoiceData.salesperson || {};
            // doc.text(`Name: ${salespersonData.name || 'N/A'}`, 120, 77);
            // doc.text(`Email: ${salespersonData.email || 'N/A'}`, 120, 82);
    
            // Table Data
            const items = [{
                description: invoiceData.description,
                stock_code: invoiceData.stock_code,
                price: Number(invoiceData.price || invoiceData.total) || 0,
                quantity: Number(invoiceData.quantity || 1),
                total: Number(invoiceData.total) || 0
            }];
    
            // Items Table
            autoTable(doc, {
                startY: 95,
                head: [['Item', 'Stock Code', 'Price', 'Quantity', 'Total']],
                body: items.map(item => [
                    item.description || 'Unnamed Item',
                    item.stock_code || 'N/A',
                    item.price.toFixed(2),
                    item.quantity,
                    item.total.toFixed(2)
                ]),
                theme: 'plain',
                headStyles: {
                    fillColor: [240, 240, 240],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    fontSize: 7
                },
                styles: { fontSize: 7 },
                columnStyles: {
                    0: { cellWidth: 60 },  // Item
                    1: { cellWidth: 30, halign: 'center' }, // Stock Code
                    2: { cellWidth: 25, halign: 'right' }, // Price
                    3: { cellWidth: 25, halign: 'center' }, // Quantity
                    4: { cellWidth: 30, halign: 'right' }  // Total
                },
                margin: { left: 5, right: 5 }
            });
    
            const finalY = (doc as any).lastAutoTable.finalY + 10;
    
            // Totals
            let yPos = finalY;
            const totalsX = 130;
            const valuesX = 190;
    
            const totalValue = Number(invoiceData.total) || 0;
            const tax = Number(invoiceData.tax || 0);
            const discount = Number(invoiceData.discount || 0);
            const taxAmount = (totalValue * tax) / 100;
            const discountAmount = (totalValue * discount) / 100;
            const finalTotal = totalValue + taxAmount - discountAmount;
    
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
    
            // Subtotal
            doc.text('Subtotal:', totalsX, yPos, { align: 'right' });
            doc.text(`$${totalValue.toFixed(2)}`, valuesX, yPos, { align: 'right' });
            yPos += 6;
    
            // Tax
            doc.text(`Tax (${tax}%):`, totalsX, yPos, { align: 'right' });
            doc.text(`$${taxAmount.toFixed(2)}`, valuesX, yPos, { align: 'right' });
            yPos += 6;
    
            // Discount
            doc.text(`Discount (${discount}%):`, totalsX, yPos, { align: 'right' });
            doc.text(`-$${discountAmount.toFixed(2)}`, valuesX, yPos, { align: 'right' });
            yPos += 6;
    
            // Line
            doc.setLineWidth(0.5);
            doc.line(totalsX - 20, yPos, valuesX + 10, yPos);
            yPos += 5;
    
            // Final Total
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Total:', totalsX, yPos, { align: 'right' });
            doc.text(`$${finalTotal.toFixed(2)}`, valuesX, yPos, { align: 'right' });
    
            // Additional Info
            yPos += 15;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
    
            if (invoiceData.goldRate) {
                doc.text(`Gold Rate: $${invoiceData.goldRate.toFixed(2)}/oz`, 20, yPos);
                yPos += 6;
            }
    
            // Save
            doc.save(`Invoice_${invoiceData.invoiceNumber}.pdf`);
    
            return true;
        } catch (error) {
            console.error('Error generating PDF:', error);
            return false;
        } finally {
            setGeneratingPdf(false);
        }
    };
    

    // Handle download invoice
    const handleDownloadInvoice = async (invoiceData: any) => {
        await generateInvoicePDF(invoiceData);
    };

    console.log(recordsData,'this is the record data')

    return (
        <div>
            <div className="panel mt-6">
                <h5 className="font-semibold text-lg dark:text-white-light mb-5">Sold Products</h5>
                
                {loading ? (
                    <div className="flex items-center justify-center h-24">
                        <span className="animate-spin border-2 border-primary border-l-transparent rounded-full w-6 h-6 inline-block align-middle m-2"></span>
                        Loading...
                    </div>
                ) : (
                    <div className="datatables">
                        <DataTable
                            noRecordsText="No sold products found"
                            highlightOnHover
                            className="whitespace-nowrap table-hover"
                            records={recordsData}
                            columns={[
                                { accessor: 'invoiceNumber', title: 'Invoice #' },
                                { accessor: 'stock_code', title: 'Stock Code' },
                                { accessor: 'description', title: 'Description' },
                                { 
                                    accessor: 'invoiceDate', 
                                    title: 'Date',
                                    render: ({ invoiceDate }) => formatDate(invoiceDate)
                                },
                               
                                { 
                                    accessor: 'total',
                                    title: 'Total',
                                    render: ({ total }) => formatCurrency(total)
                                },
                                { 
                                    accessor: 'customerInfo',
                                    title: 'Customer',
                                    render: ({ userName, userEmail }) => (
                                        <div>
                                            <div className="font-semibold">{userName}</div>
                                            <div className="text-xs text-gray-500">{userEmail}</div>
                                        </div>
                                    )
                                },
                                {
                                    accessor: 'actions',
                                    title: 'Actions',
                                    render: (record) => (
                                        <div className="flex gap-2">
                                            <button 
                                                type="button" 
                                                className="btn btn-sm btn-primary"
                                                onClick={() => handleDownloadInvoice(record)}
                                                disabled={generatingPdf}
                                            >
                                                {generatingPdf ? (
                                                    <>
                                                        <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-4 h-4 inline-block align-middle mr-2"></span>
                                                        Generating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-5 h-5 ltr:mr-2 rtl:ml-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M15.25 22.7502H9.25C3.82 22.7502 1.5 20.4302 1.5 15.0002V9.00024C1.5 3.57024 3.82 1.25024 9.25 1.25024H14.25C14.66 1.25024 15 1.59024 15 2.00024C15 2.41024 14.66 2.75024 14.25 2.75024H9.25C4.64 2.75024 3 4.39024 3 9.00024V15.0002C3 19.6102 4.64 21.2502 9.25 21.2502H15.25C19.86 21.2502 21.5 19.6102 21.5 15.0002V10.0002C21.5 9.59024 21.84 9.25024 22.25 9.25024C22.66 9.25024 23 9.59024 23 10.0002V15.0002C23 20.4302 20.68 22.7502 15.25 22.7502Z" fill="currentColor" />
                                                            <path d="M22.25 10.7502H18.25C14.83 10.7502 13.5 9.42023 13.5 6.00023V2.00023C13.5 1.70023 13.68 1.42023 13.96 1.31023C14.24 1.19023 14.56 1.26023 14.78 1.47023L22.78 9.47023C22.99 9.68023 23.06 10.0102 22.94 10.2902C22.82 10.5702 22.55 10.7502 22.25 10.7502ZM15 3.81023V6.00023C15 8.58023 15.67 9.25023 18.25 9.25023H20.44L15 3.81023Z" fill="currentColor" />
                                                            <path d="M13.25 13.7502H7.25C6.84 13.7502 6.5 13.4102 6.5 13.0002C6.5 12.5902 6.84 12.2502 7.25 12.2502H13.25C13.66 12.2502 14 12.5902 14 13.0002C14 13.4102 13.66 13.7502 13.25 13.7502Z" fill="currentColor" />
                                                            <path d="M11.25 17.7502H7.25C6.84 17.7502 6.5 17.4102 6.5 17.0002C6.5 16.5902 6.84 16.2502 7.25 16.2502H11.25C11.66 16.2502 12 16.5902 12 17.0002C12 17.4102 11.66 17.7502 11.25 17.7502Z" fill="currentColor" />
                                                        </svg>
                                                        Download Invoice
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )
                                }
                            ]}
                            totalRecords={salesperson?.selledProducts?.length || 0}
                            recordsPerPage={pageSize}
                            page={page}
                            onPageChange={(p) => setPage(p)}
                            recordsPerPageOptions={PAGE_SIZES}
                            onRecordsPerPageChange={setPageSize}
                            minHeight={200}
                            paginationText={({ from, to, totalRecords }) => `Showing ${from} to ${to} of ${totalRecords} entries`}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default SoldProducts;