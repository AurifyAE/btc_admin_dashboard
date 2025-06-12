import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconX from '../../components/Icon/IconX';
import Select from 'react-select';
import axios from 'axios';
import io from 'socket.io-client';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable'; // For easy table creation
import { saveAs } from 'file-saver';
import FileSaver from 'file-saver';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';

const Add = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    const [users, setUsers] = useState<any>([]);
    const [name, setName] = useState<any>(null);
    const [email, setEmail] = useState<any>(null);
    const [address, setAddress] = useState<any>(null);
    const [salesperson, setSalesPerson] = useState<any>(null);
    const [phone, setPhone] = useState<any>(null);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isChecked, setIsChecked] = useState(true);
    const [invoiceNumberIs, setInvoiceNumberIs] = useState<any>(null);
    const [invoiceDate, setInvoiceDate] = useState(new Date());
    const [items, setItems] = useState<any>([]);
    const [tax, setTax] = useState<number | null>(null);
    const [shippingRate, setShippingRate] = useState<number>(0);
    const [discount, setDiscount] = useState<number | null>(null);
    const backendUrl = import.meta.env.VITE_API_URL;
    const [loading, setLoading] = useState<boolean>(false);
    const [productsInHand, setProductsInHand] = useState<any[]>([]);
    const [userData, setUserData] = useState<any>(null);
    const [scannedProductId, setScannedProductId] = useState<string>(''); // For scanner input
    const [selectedProducts, setSelectedProducts] = useState<any[]>([]); // Track selected products
    const [goldRate, setGoldRate] = useState<number>(0); // State to store gold rate

    const handleDateChange = (e: any) => {
        setInvoiceDate(new Date(e.target.value));
    };

    useEffect(() => {
        if (!token || userRole !== 'salesperson') {
            navigate('/auth/cover-login');
            return;
        }
        
    }, [navigate]);

    useEffect(() => {
        // Fetch initial gold rate
        fetchGoldRate();

        // Setup Socket.IO connection
        const socket = io(backendUrl);

        socket.on('connect', () => {
            console.log('Connected to Socket.IO server');
        });

        // Listen for metal rate updates
        socket.on('metalRateUpdate', (data) => {
            console.log('Received real-time gold rate update:', data);
            setGoldRate(data.rate);
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from Socket.IO server');
        });

        socket.on('connect_error', (error) => {
            console.error('Socket.IO connection error:', error);
        });

        // Clean up socket connection on component unmount
        return () => {
            console.log('Cleaning up socket connection');
            socket.disconnect();
        };
    }, [backendUrl]);

    // Function to fetch gold rate from API
    const fetchGoldRate = async () => {
        try {
            const response = await axios.get(`${backendUrl}/admin/rate`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            // Store rate information
            setGoldRate(response.data.rate);

            console.log('Gold Rate Data:', response.data);
        } catch (error) {
            console.error('Error fetching gold rate:', error);
        }
    };

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get(`${backendUrl}/salesperson/get-users`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                console.log('Users:', response.data);
                // Transform users data for react-select
                const transformedUsers = response.data.map((user: any) => ({
                    value: user.id,
                    label: `${user.name} - ${user.email}`, // Display name and email for better identification
                    ...user, // Include all user details
                }));

                setUsers(transformedUsers);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        fetchUsers();
    }, [token]);

    const fetchProductsForUser = async (userId: string) => {
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
            const salespersonData = response.data.salesperson;
            setSalesPerson(salespersonData);
            console.log('Salesperson Data:', salespersonData);
            const products = salespersonData.assignedProducts || [];

            // Normalize _id to id for the datatable
            const normalizedProducts = products.map((item: any) => ({
                ...item,
                id: item._id || item.id,
            }));

            setProductsInHand(normalizedProducts);
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    console.log('productsInHand:', productsInHand);

    useEffect(() => {
        dispatch(setPageTitle('Products in Hand'));

  
        try {
            const storedUserData = localStorage.getItem('userData');
            if (storedUserData) {
                const parsedData = JSON.parse(storedUserData);
                setUserData(parsedData);
            } else {
                console.error('No user data found in localStorage');
            }
        } catch (err) {
            console.error('Error parsing user data from localStorage:', err);
        }
    }, [navigate]);

    useEffect(() => {
        if (userData && userData.id) {
            fetchProductsForUser(userData.id);
        }
    }, [userData]);

    // Handle user selection
    const handleUserChange = (selected: any) => {
        setSelectedUser(selected); // Update selected user
        setName(selected.name);
        setEmail(selected.email);
        setAddress(selected.location);
        setPhone(selected.phone);
    };

    useEffect(() => {
        dispatch(setPageTitle('Invoice Add'));
    });

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            navigate('/auth/cover-login'); // Redirect to login if token doesn't exist
        }
    }, [navigate]);

    const removeItem = (item: any = null) => {
        setItems(items.filter((d: any) => d.id !== item.id));

        // If item has an original productId, add it back to available products
        if (item.originalProductId) {
            const productToAddBack = productsInHand.find((p) => (p.productId?._id || p.productId?.id) === item.originalProductId);

            if (productToAddBack) {
                setSelectedProducts((prev) => prev.filter((sp) => (sp.productId?._id || sp.productId?.id) !== item.originalProductId));
            }
        }
    };

    //For automated invoice number
    const invoiceNumber = useMemo(() => {
        // Example: INV-20250512-123456
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.floor(1000 + Math.random() * 9000);
        return `INV-${dateStr}-${random}`;
    }, []);

    useEffect(() => {
        setInvoiceNumberIs(invoiceNumber);
    }, []);

    // Calculate subtotal, tax, shipping, discount and total

    // Function to handle scanned product
    // const handleScanProduct = async () => {
    //     if (!scannedProductId) return;

    //     try {
    //         const response = await axios.get(`${backendUrl}/products/${scannedProductId}`, {
    //             headers: { Authorization: `Bearer ${token}` },
    //         });

    //         const product = response.data;
    //         const productId = product._id || product.id;

    //         // Check if product is already in the items list
    //         const productExists = items.some((item: any) => item.originalProductId === productId);

    //         if (!productExists) {
    //             // Add the scanned product to the items list with default values for all required fields
    //             setItems((prevItems: any) => [
    //                 ...prevItems,
    //                 {
    //                     id: Date.now(), // Unique ID for the item
    //                     originalProductId: productId, // Store original product ID
    //                     title: product.name || '',
    //                     description: product.description || '',
    //                     stock_code: product.stock_code || '',
    //                     gross_weight: product.gross_weight || 0,
    //                     stone_weight: product.stone_weight || 0,
    //                     net_weight: product.net_weight || 0,
    //                     pure_weight: product.pure_weight || 0,
    //                     mkg_rate: product.mkg_rate || 0,
    //                     mkg_amount: product.mkg_amount || 0,
    //                     net_amount: product.net_amount || parseFloat(product.price) || 0,
    //                     barcode: product.barcode || scannedProductId,
    //                     rate: parseFloat(product.price) || 0,
    //                     quantity: 1,
    //                     total: parseFloat(product.price) || 0,
    //                 },
    //             ]);

    //             // Add to selected products to remove from options
    //             setSelectedProducts((prev) => [...prev, { productId: product }]);
    //         }

    //         // Clear the scanned product ID
    //         setScannedProductId('');
    //     } catch (error) {
    //         console.error('Error fetching product details:', error);
    //     }
    // };

    // Function to handle manual product selection
    const handleProductSelect = (selected: any) => {
        if (!selected) {
            // If all selections are cleared, remove all products
            setItems([]);
            setSelectedProducts([]);
            return;
        }

        // Get currently selected product IDs for comparison
        const currentlySelectedIds = selected.map((selection: any) => {
            const product = selection.productId || selection;
            return product._id || product.id;
        });

        // Find items to remove (items that are no longer in the selection)
        const itemsToKeep = items.filter((item: any) => {
            // Keep items that don't have originalProductId (manually added) or are still selected
            return !item.originalProductId || currentlySelectedIds.includes(item.originalProductId);
        });

        // Find new items to add (selections that aren't already in the items list)
        const newItems = [...itemsToKeep];
        let updatedSelectedProducts = [...selected];

        // Process each selected product to add any new ones
        selected.forEach((selection: any) => {
            if (!selection) return;

            // Extract product details from the nested productId structure
            const product = selection.productId || selection;
            const productId = product._id || product.id;

            // Check if the product is already added to items
            const productExists = itemsToKeep.some((item: any) => item.originalProductId === productId);

            if (!productExists) {
                newItems.push({
                    id: Date.now() + Math.random(), // Unique ID for the item
                    originalProductId: productId, // Store original product ID
                    title: product.name || '',
                    description: product.description || '',
                    stock_code: product.stock_code || '',
                    gross_weight: product.gross_weight || 0,
                    stone_weight: product.stone_weight || 0,
                    net_weight: product.net_weight || 0,
                    pure_weight: product.pure_weight || 0,
                    mkg_rate: product.mkg_rate || 0,
                    mkg_amount: product.mkg_amount || 0,
                    net_amount: product.net_amount || parseFloat(product.price) || 0,
                    barcode: product.barcode || '',
                    rate: parseFloat(product.price) || 0,
                    quantity: 1,
                    total: parseFloat(product.price) || 0,
                });
            }
        });

        setItems(newItems);
        setSelectedProducts(updatedSelectedProducts);
    };

    // Format products for the dropdown select, excluding already selected ones
    const productOptions = useMemo(() => {
        // Get the IDs of all selected products
        const selectedProductIds = selectedProducts.map((p) => p.productId?._id || p.productId?.id || p.value);

        // Filter out already selected products
        return productsInHand
            .filter((product) => {
                const productId = product.productId?._id || product.productId?.id || product._id || product.id;
                return !selectedProductIds.includes(productId);
            })
            .map((product) => {
                const productData = product.productId || product;
                return {
                    value: productData._id || productData.id,
                    label: `${productData.description} - ${productData.stock_code || 'No SKU'}`,
                    productId: productData,
                };
            });
    }, [productsInHand, selectedProducts]);

    // Calculate total net amount
    const totalNetAmount = useMemo(() => {
        return items.reduce((sum: number, item: any) => sum + (item.net_amount || 0), 0);
    }, [items]);
    const gramRate = goldRate / 31.103;

    // Calculate totals for all required fields
    const totals = useMemo(() => {
        return {
            gross_weight: items.reduce((sum: number, item: any) => sum + (parseFloat(item.gross_weight) || 0), 0),
            stone_weight: items.reduce((sum: number, item: any) => sum + (parseFloat(item.stone_weight) || 0), 0),
            net_weight: items.reduce((sum: number, item: any) => sum + (parseFloat(item.net_weight) || 0), 0),
            pure_weight: items.reduce((sum: number, item: any) => sum + (parseFloat(item.pure_weight) || 0), 0),
            mkg_rate: items.reduce((sum: number, item: any) => sum + (parseFloat(item.mkg_rate) || 0), 0),
            mkg_amount: items.reduce((sum: number, item: any) => sum + (parseFloat(item.mkg_amount) || 0), 0),
            // Calculate net_amount using the current gold rate
            net_amount: items.reduce((sum: number, item: any) => {
                const pureGoldRate = gramRate * (parseFloat(item.pure_weight) || 0);
                const calculatedNetAmount = pureGoldRate + (parseFloat(item.mkg_rate) || 0) + (parseFloat(item.mkg_amount) || 0);
                return sum + calculatedNetAmount;
            }, 0),
        };
    }, [items, gramRate]);

    const subtotal = useMemo(() => {
        // Use the already calculated total net amount from the totals object
        return totals.net_amount || 0;
    }, [totals.net_amount]);

    const taxAmount = useMemo(() => {
        if (tax === null) return 0;
        return (subtotal * tax) / 100;
    }, [subtotal, tax]);

    const discountAmount = useMemo(() => {
        if (discount === null) return 0;
        return (subtotal * discount) / 100;
    }, [subtotal, discount]);

    const total = useMemo(() => {
        return subtotal + taxAmount + shippingRate - discountAmount;
    }, [subtotal, taxAmount, shippingRate, discountAmount]);

    console.log('invoice number', invoiceNumberIs);
    console.log('invoice date', invoiceDate);
    console.log('selectedUser:', selectedUser);
    console.log('current gold rate:', goldRate);
    console.log('salesperson:', salesperson);
    console.log('selected Products', items);

    const handleCreateInvoice = async () => {
        // First show confirmation dialog
        const result = await Swal.fire({
            title: 'Confirm Invoice Creation',
            text: 'Are you sure you want to create this invoice?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, create it!',
            cancelButtonText: 'Cancel'
        });
    
        // If user cancels, exit the function
        if (!result.isConfirmed) {
            showMessage('Invoice creation cancelled', 'info');
            return;
        }
    
        // Proceed with invoice creation if confirmed
        setLoading(true);
    
        try {
            // Validate data before processing
            if (!items || items.length === 0) {
                throw new Error('No items added to invoice');
            }
    
            if (!selectedUser) {
                throw new Error('No customer selected');
            }
    
            // Ensure all numeric values are properly defined
            const safeSubtotal = Number(subtotal) || 0;
            const safeTaxAmount = Number(taxAmount) || 0;
            const safeDiscountAmount = Number(discountAmount) || 0;
            const safeTotal = Number(total) || 0;
            const safeTax = Number(tax) || 0;
            const safeDiscount = Number(discount) || 0;
            const safeShippingRate = Number(shippingRate) || 0;
            const safeGoldRate = goldRate ? Number(goldRate) || 0 : null;
    
            // Prepare the invoice data
            const invoiceData = {
                invoiceNumber: invoiceNumberIs || `INV-${Date.now()}`,
                invoiceDate: invoiceDate || new Date().toLocaleDateString(),
                user: selectedUser,
                items: items.map((item: any) => ({
                    name: item.description || 'Unnamed Item',
                    quantity: Number(item.quantity) || 0,
                    price: Number(item.rate) || 0,
                    _id: item.originalProductId || item.id || item._id,
                    barcode: item.barcode || '',
                    description: item.description || '',
                    gross_weight: Number(item.gross_weight) || 0,
                    id: item.id,
                    mkg_amount: Number(item.mkg_amount) || 0,
                    mkg_rate: Number(item.mkg_rate) || 0,
                    net_amount: Number(item.net_amount) || 0,
                    net_weight: Number(item.net_weight) || 0,
                    originalProductId: item.originalProductId || '',
                    pure_weight: Number(item.pure_weight) || 0,
                    rate: Number(item.rate) || 0,
                    stock_code: item.stock_code || '',
                    stone_weight: Number(item.stone_weight) || 0,
                    title: item.title || '',
                    total: Number(item.total) || 0,
                })),
                totals: {
                    subtotal: safeSubtotal,
                    taxAmount: safeTaxAmount,
                    discountAmount: safeDiscountAmount,
                    total: safeTotal,
                },
                tax: safeTax,
                discount: safeDiscount,
                shippingRate: safeShippingRate,
                goldRate: safeGoldRate,
                gramRate,
                salesperson,
            };
    
            // First, make the API call to the backend
            const response = await fetch(`${backendUrl}/salesperson/create-invoice`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(invoiceData),
            });
    
            // Check if the API call was successful
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save invoice to the server');
            }
    
            // If API call is successful, proceed with generating PDF
            const responseData = await response.json();
            console.log('Invoice saved successfully:', responseData);
    
            // Generate PDF
            const pdfBlob = await generateInvoicePDF(invoiceData);
    
            // Save the PDF file
            const fileName = `Invoice-${invoiceNumberIs}.pdf`;
    
            // Create download link
            const url = URL.createObjectURL(pdfBlob as Blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
    
            console.log('Invoice PDF generated and downloaded successfully!');
    
            // Show success message
            showMessage('Invoice created successfully!', 'success');
    
            // Reload the page after a short delay to ensure PDF download starts
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            console.error('Error generating invoice:', error);
            showMessage(`Failed to generate invoice: ${error instanceof Error ? error.message : 'Please try again'}`, 'error');
        } finally {
            // Ensure loading is set to false in all cases
            setLoading(false);
        }
    };
    const generateInvoicePDF = (invoiceData: any) => {
        return new Promise((resolve) => {
            // Create a document - A4 size
            const doc = new jsPDF();

            // Set font
            doc.setFont('helvetica');

            // Add company logo/header
            doc.setFontSize(20);
            doc.text('BTC', doc.internal.pageSize.width / 2, 20, { align: 'center' });
            doc.setFontSize(10);
            doc.text('123 Business Street, City, Country', doc.internal.pageSize.width / 2, 27, { align: 'center' });
            doc.text('Phone: (123) 456-7890 | Email: info@company.com', doc.internal.pageSize.width / 2, 32, { align: 'center' });

            // Add invoice details
            doc.setFontSize(16);
            doc.text('Invoice', 20, 45);
            doc.setLineWidth(0.5);
            doc.line(20, 47, 50, 47);

            doc.setFontSize(10);
            doc.text(`Invoice Number: ${invoiceData.invoiceNumber}`, 20, 55);
            const date = new Date(invoiceData.invoiceDate);
            const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;

            doc.text(`Date: ${formattedDate}`, 20, 60);

            // Add customer details with proper validation
            doc.setFontSize(12);
            doc.text('Customer Details', 20, 70);
            doc.setFontSize(10);

            const customerDetails = [];
            if (invoiceData.user) {
                customerDetails.push(`Name: ${invoiceData.user.name || 'N/A'}`);
                customerDetails.push(`Email: ${invoiceData.user.email || 'N/A'}`);
                customerDetails.push(`Phone: ${invoiceData.user.phone || 'N/A'}`);
                if (invoiceData.user.location) {
                    customerDetails.push(`Address: ${invoiceData.user.location}`);
                }
            } else {
                customerDetails.push('Name: N/A');
                customerDetails.push('Email: N/A');
                customerDetails.push('Phone: N/A');
            }

            let customerY = 77;
            customerDetails.forEach((detail) => {
                doc.text(detail, 20, customerY);
                customerY += 5;
            });

            // Add items table
            const itemsTableData: any[] = [];
            // Add items to table with proper validation
            items.forEach((item: any) => {
                // Ensure values are properly defined and converted to numbers
                const itemName = item.description || 'Unnamed Item';
                const price = Number(item.price) || 0;
                const quantity = Number(item.quantity) || 0;
                const total = price * quantity;

                const grossWeight = Number(item.gross_weight) || 0;
                const stoneWeight = Number(item.stone_weight) || 0;
                const netWeight = Number(item.net_weight) || 0;
                const pureWeight = Number(item.pure_weight) || 0;
                const pureGoldRate = (invoiceData.goldRate / 31.103) * pureWeight;
                const mkgRate = Number(item.mkg_rate) || 0;
                const mkgAmount = Number(item.mkg_amount) || 0;

                itemsTableData.push([
                    itemName, // This is likely a string, so no toFixed()
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

            // Create the table
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

            // Current position after the table
            // const finalY = (doc).lastAutoTable.finalY + 10;
            const finalY = (doc as any).lastAutoTable.finalY + 10;
            // Add totals with proper validation
            let yPos = finalY;
            const totalsX = 130;
            const valuesX = 190;

            // Ensure all values are numbers before using toFixed
            const subtotalValue = Number(invoiceData.totals.subtotal) || 0;
            const taxValue = Number(invoiceData.totals.taxAmount) || 0;
            const discountValue = Number(invoiceData.totals.discountAmount) || 0;
            const totalValue = Number(invoiceData.totals.total) || 0;

            // Subtotal
            doc.text('Subtotal:', totalsX, yPos, { align: 'right' });
            doc.text(`$${subtotalValue.toFixed(2)}`, valuesX, yPos, { align: 'right' });
            yPos += 6;

            // Tax - Always show tax (even if 0)
            doc.text(`Tax (${invoiceData.tax}%):`, totalsX, yPos, { align: 'right' });
            doc.text(`$${taxValue.toFixed(2)}`, valuesX, yPos, { align: 'right' });
            yPos += 6;

            // Discount - Always show discount (even if 0)
            doc.text(`Discount (${invoiceData.discount}%):`, totalsX, yPos, { align: 'right' });
            doc.text(`-$${discountValue.toFixed(2)}`, valuesX, yPos, { align: 'right' });
            yPos += 6;

            // Shipping rate if applicable
            if (invoiceData.shippingRate > 0) {
                doc.text('Shipping:', totalsX, yPos, { align: 'right' });
                doc.text(`$${invoiceData.shippingRate.toFixed(2)}`, valuesX, yPos, { align: 'right' });
                yPos += 6;
            }

            // Draw a line before final total
            doc.setLineWidth(0.5);
            doc.line(totalsX - 20, yPos, valuesX + 10, yPos);
            yPos += 5;

            // Final total
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
                doc.text(`Gold Rate: $${invoiceData.goldRate.toFixed(2)}/oz`, 20, yPos);
                yPos += 6;
            }

            // Add salesperson if available
            if (salesperson) {
                doc.text(`Sold by: ${salesperson.name || 'N/A'}`, 20, yPos);
                yPos += 6;
            }

            // Convert the PDF to a blob
            const pdfBlob = doc.output('blob');
            resolve(pdfBlob);
        });
    };

    const showMessage = (msg: string = '', type: 'success' | 'error' | 'warning' | 'info' | 'question' = 'success') => {
        Swal.fire({
            icon: type,
            title: msg,
            toast: true,
            position: 'top',
            showConfirmButton: false,
            timer: 3000,
        });
    };

    return (
        <div className="flex xl:flex-row flex-col gap-2.5">
            <div className="panel px-0 flex-1 py-6 ltr:xl:mr-6 rtl:xl:ml-6">
                <div className="flex justify-between flex-wrap px-4">
                    <div className="mb-6 lg:w-1/2 w-full">
                        <div className="flex items-center text-black dark:text-white shrink-0">
                            <h1 style={{ fontSize: '40px' }}>BTC</h1>
                        </div>
                        <div className="space-y-1 mt-6 text-gray-500 dark:text-gray-400">
                            <div>sample address</div>
                            <div>btc@gmail.com</div>
                            <div>+1 (070) 123-4567</div>
                        </div>
                    </div>
                    <div className="lg:w-1/2 w-full lg:max-w-fit">
                        <div className="flex items-center">
                            <label htmlFor="number" className="flex-1 ltr:mr-2 rtl:ml-2 mb-0">
                                Invoice Number
                            </label>
                            <input id="number" type="text" name="inv-num" className="form-input lg:w-[250px] w-2/3" defaultValue={invoiceNumber} readOnly />{' '}
                        </div>
                        <div className="flex items-center mt-4">
                            <label htmlFor="startDate" className="flex-1 ltr:mr-2 rtl:ml-2 mb-0">
                                Invoice Date
                            </label>
                            <input id="startDate" type="date" name="inv-date" value={invoiceDate.toISOString().split('T')[0]} onChange={handleDateChange} className="form-input lg:w-[250px] w-2/3" />
                        </div>
                    </div>
                </div>
                <hr className="border-white-light dark:border-[#1b2e4b] my-6" />
                <div className="mt-8 px-4">
                    <div className="flex justify-between lg:flex-row flex-col">
                        <div className="lg:w-1/2 w-full ltr:lg:mr-6 rtl:lg:ml-6 mb-6">
                            <div className="text-lg">Bill To :-</div>
                            <div className="mt-4 flex items-center">
                                <label htmlFor="reciever-name" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">
                                    Customer
                                </label>
                                <Select placeholder="Select or search customers..." className="form-input flex-1 p-0 border-white" value={selectedUser} options={users} onChange={handleUserChange} />
                            </div>

                            <div className="mt-4 flex items-center">
                                <label htmlFor="reciever-name" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">
                                    Name
                                </label>
                                <input
                                    id="reciever-name"
                                    type="text"
                                    name="reciever-name"
                                    value={name || ''}
                                    onChange={(e) => setName(e.target.value)}
                                    className="form-input flex-1"
                                    placeholder="Enter Name"
                                />
                            </div>
                            <div className="mt-4 flex items-center">
                                <label htmlFor="reciever-email" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">
                                    Email
                                </label>
                                <input
                                    value={email || ''}
                                    onChange={(e) => setEmail(e.target.value)}
                                    id="reciever-email"
                                    type="email"
                                    name="reciever-email"
                                    className="form-input flex-1"
                                    placeholder="Enter Email"
                                />
                            </div>
                            <div className="mt-4 flex items-center">
                                <label htmlFor="reciever-address" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">
                                    Address
                                </label>
                                <input
                                    value={address || ''}
                                    onChange={(e) => setAddress(e.target.value)}
                                    id="reciever-address"
                                    type="text"
                                    name="reciever-address"
                                    className="form-input flex-1"
                                    placeholder="Enter Address"
                                />
                            </div>
                            <div className="mt-4 flex items-center">
                                <label htmlFor="reciever-number" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">
                                    Phone Number
                                </label>
                                <input
                                    value={phone || ''}
                                    onChange={(e) => setPhone(e.target.value)}
                                    id="reciever-number"
                                    type="text"
                                    name="reciever-number"
                                    className="form-input flex-1"
                                    placeholder="Enter Phone number"
                                />
                            </div>
                        </div>
                        <div className="lg:w-1/2 w-full">
                            <div className="text-lg">Other details: </div>
                            <div className="flex items-center mt-4">
                                <label htmlFor="acno" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">
                                    Current Gold Rate $
                                </label>
                                <input id="acno" readOnly type="text" name="acno" className="form-input flex-1" value={`$ ${goldRate}`} />
                            </div>
                            <div className="flex items-center mt-4">
                                <label htmlFor="acno" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">
                                    Entered By{' '}
                                </label>
                                <input id="acno" readOnly type="text" name="acno" className="form-input flex-1" value={salesperson?.name} />
                            </div>

                         
                        </div>
                    </div>
                </div>
                <div className="mt-8 px-4">
                 
                    <div className="flex items-center mb-4">
                        <label htmlFor="product-select" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">
                            Select Products
                        </label>
                        <Select
                            id="product-select"
                            placeholder="Select or scan multiple products..."
                            options={productOptions}
                            value={selectedProducts}
                            onChange={(selected) => handleProductSelect(selected)}
                            className="form-input flex-1 p-0"
                            isMulti
                            closeMenuOnSelect={false}
                        />
                    </div>
                </div>

                <div className="mt-8">
                    <div className="table-responsive">
                        <table className="min-w-full bg-white border border-gray-200">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="px-4 py-2 text-left border-b">#</th>
                                    <th className="px-4 py-2 text-left border-b">Stock Code</th>
                                    <th className="px-4 py-2 text-left border-b">Description</th>
                                    <th className="px-4 py-2 text-left border-b">Gross Weight</th>
                                    <th className="px-4 py-2 text-left border-b">Stone Weight</th>
                                    <th className="px-4 py-2 text-left border-b">Net Weight</th>
                                    <th className="px-4 py-2 text-left border-b">Pure Weight</th>
                                    <th className="px-4 py-2 text-left border-b">Pure Gold Rate</th>
                                    <th className="px-4 py-2 text-left border-b">MKG Rate</th>
                                    <th className="px-4 py-2 text-left border-b">MKG Amount</th>
                                    <th className="px-4 py-2 text-left border-b">Net Amount</th>
                                    <th className="px-4 py-2 text-left border-b">Barcode</th>
                                    <th className="px-4 py-2 text-left border-b w-12"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length <= 0 && (
                                    <tr>
                                        <td colSpan={13} className="px-4 py-2 text-center font-semibold border-b">
                                            No Items Available
                                        </td>
                                    </tr>
                                )}
                                {items.map((item: any, index: number) => {
                                    // Calculate pure gold rate for this item
                                    const pureGoldRate = gramRate * (parseFloat(item.pure_weight) || 0);

                                    // Calculate net amount as pure gold rate + MKG rate + MKG amount
                                    const calculatedNetAmount = pureGoldRate + (parseFloat(item.mkg_rate) || 0) + (parseFloat(item.mkg_amount) || 0);

                                    // Update the item's net_amount property with the calculated value
                                    item.net_amount = calculatedNetAmount;

                                    return (
                                        <tr key={item.id} className="border-b">
                                            <td className="px-4 py-2">{index + 1}</td>
                                            <td className="px-4 py-2">{item.stock_code || ''}</td>
                                            <td className="px-4 py-2">{item.description || ''}</td>
                                            <td className="px-4 py-2">{item.gross_weight || 0}</td>
                                            <td className="px-4 py-2">{item.stone_weight || 0}</td>
                                            <td className="px-4 py-2">{item.net_weight || 0}</td>
                                            <td className="px-4 py-2">{item.pure_weight || 0}</td>
                                            <td className="px-4 py-2">${pureGoldRate.toFixed(2)}</td>
                                            <td className="px-4 py-2">${(item.mkg_rate || 0).toFixed(2)}</td>
                                            <td className="px-4 py-2">${(item.mkg_amount || 0).toFixed(2)}</td>
                                            <td className="px-4 py-2">${calculatedNetAmount.toFixed(2)}</td>
                                            <td className="px-4 py-2">{item.barcode || ''}</td>
                                            <td className="px-4 py-2">
                                                <button type="button" onClick={() => removeItem(item)} className="text-red-500 hover:text-red-700">
                                                    <IconX className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                <tr className="bg-gray-100 font-semibold">
                                    <td colSpan={3} className="px-4 py-2 text-right">
                                        Totals:
                                    </td>
                                    <td className="px-4 py-2">{totals.gross_weight.toFixed(2)}</td>
                                    <td className="px-4 py-2">{totals.stone_weight.toFixed(2)}</td>
                                    <td className="px-4 py-2">{totals.net_weight.toFixed(2)}</td>
                                    <td className="px-4 py-2">{totals.pure_weight.toFixed(2)}</td>
                                    <td className="px-4 py-2">${(gramRate * totals.pure_weight).toFixed(2)}</td>
                                    <td className="px-4 py-2">${totals.mkg_rate.toFixed(2)}</td>
                                    <td className="px-4 py-2">${totals.mkg_amount.toFixed(2)}</td>
                                    <td className="px-4 py-2">${totals.net_amount.toFixed(2)}</td>
                                    <td colSpan={2}></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-between sm:flex-row flex-col mt-6 px-4">
                        <div className="sm:mb-0 mb-6">{/* Button removed */}</div>
                        <div className="sm:w-2/5">
                            <div className="flex items-center justify-between">
                                <div>Subtotal</div>
                                <div>${subtotal.toFixed(2)}</div>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center">
                                    <span>Tax(%)</span>
                                    <input
                                        type="number"
                                        className="form-input w-20 ml-2"
                                        min="0"
                                        value={tax === null ? '' : tax}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setTax(value === '' ? null : Number(value));
                                        }}
                                    />
                                </div>
                                <div>${(taxAmount ?? 0).toFixed(2)}</div>
                            </div>
                            {/* <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center">
                                    <span>Discount(%)</span>
                                    <input
                                        type="number"
                                        className="form-input w-20 ml-2"
                                        min="0"
                                        max="100"
                                        value={discount === null ? '' : discount}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setDiscount(value === '' ? null : Number(value));
                                        }}
                                    />
                                </div>
                                <div>${(discountAmount ?? 0).toFixed(2)}</div>
                            </div> */}
                            <div className="flex items-center justify-between mt-4 font-semibold">
                                <div>Total</div>
                                <div>${total.toFixed(2)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 px-4 flex justify-end">
                    <button type="button" className="btn btn-primary" onClick={handleCreateInvoice} disabled={loading}>
                        {loading ? (
                            <>
                                <span className="loading loading-spinner loading-xs"></span>
                                Processing...
                            </>
                        ) : (
                            'Sell Products'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Add;
