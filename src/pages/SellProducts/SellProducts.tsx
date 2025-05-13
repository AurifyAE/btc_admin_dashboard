import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { X } from 'lucide-react';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconX from '../../components/Icon/IconX';
import IconDownload from '../../components/Icon/IconDownload';
import IconEye from '../../components/Icon/IconEye';
import IconSend from '../../components/Icon/IconSend';
import IconSave from '../../components/Icon/IconSave';
import Select from 'react-select';
import axios from 'axios';

const Add = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    const [users, setUsers] = useState<any>([]);
    const [name, setName] = useState<any>(null);
    const [email, setEmail] = useState<any>(null);
    const [address, setAddress] = useState<any>(null);
    const [phone, setPhone] = useState<any>(null);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isChecked, setIsChecked] = useState(true);
    const backendUrl = import.meta.env.VITE_API_URL;
    const [productsInHand, setProductsInHand] = useState<any[]>([]);
    const [userData, setUserData] = useState<any>(null);
    const [scannedProductId, setScannedProductId] = useState<string>(''); // For scanner input
    const [selectedProducts, setSelectedProducts] = useState<any[]>([]); // Track selected products

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

        if (!token || userRole !== 'salesperson') {
            navigate('/auth/cover-login');
            return;
        }

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

    console.log('selectedUser:', selectedUser);

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

    const [items, setItems] = useState<any>([]);

    // Removed addItem function

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

    const changeQuantityPrice = (type: string, value: string, id: number) => {
        const list = [...items]; // Create a copy to avoid direct state mutation
        const itemIndex = list.findIndex((d: any) => d.id === id);
        if (itemIndex === -1) return;

        if (type === 'quantity') {
            list[itemIndex].quantity = Number(value);
            // Update the total amount based on new quantity
            list[itemIndex].total = list[itemIndex].rate * Number(value);
        }
        if (type === 'price') {
            list[itemIndex].rate = Number(value);
            // Update the total amount based on new price
            list[itemIndex].total = Number(value) * list[itemIndex].quantity;
        }
        setItems(list);
    };

    //For automated invoice number
    const invoiceNumber = useMemo(() => {
        // Example: INV-20250512-123456
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.floor(1000 + Math.random() * 9000);
        return `INV-${dateStr}-${random}`;
    }, []);

    // Calculate subtotal, tax, shipping, discount and total
    const [tax, setTax] = useState<number>(0);
    const [shippingRate, setShippingRate] = useState<number>(0);
    const [discount, setDiscount] = useState<number>(0);

    const subtotal = useMemo(() => {
        return items.reduce((sum: number, item: any) => sum + item.quantity * item.rate, 0);
    }, [items]);

    const taxAmount = useMemo(() => {
        return (subtotal * tax) / 100;
    }, [subtotal, tax]);

    const discountAmount = useMemo(() => {
        return (subtotal * discount) / 100;
    }, [subtotal, discount]);

    const total = useMemo(() => {
        return subtotal + taxAmount + shippingRate - discountAmount;
    }, [subtotal, taxAmount, shippingRate, discountAmount]);

    // Function to handle scanned product
    const handleScanProduct = async () => {
        if (!scannedProductId) return;

        try {
            const response = await axios.get(`${backendUrl}/products/${scannedProductId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const product = response.data;
            const productId = product._id || product.id;

            // Check if product is already in the items list
            const productExists = items.some((item) => item.originalProductId === productId);

            if (!productExists) {
                // Add the scanned product to the items list
                setItems((prevItems: any) => [
                    ...prevItems,
                    {
                        id: Date.now(), // Unique ID for the item
                        originalProductId: productId, // Store original product ID
                        title: product.name,
                        description: product.description || '',
                        rate: parseFloat(product.price) || 0,
                        quantity: 1,
                        total: parseFloat(product.price) || 0,
                    },
                ]);

                // Add to selected products to remove from options
                setSelectedProducts((prev) => [...prev, { productId: product }]);
            }

            // Clear the scanned product ID
            setScannedProductId('');
        } catch (error) {
            console.error('Error fetching product details:', error);
        }
    };

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
                    title: product.name,
                    description: product.description || '',
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
                    label: `${productData.name} - ${productData.sku || 'No SKU'} - $${productData.price || 0}`,
                    productId: productData,
                };
            });
    }, [productsInHand, selectedProducts]);

    console.log('selected product :', selectedProducts);

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
                            <input id="startDate" type="date" name="inv-date" defaultValue={new Date().toISOString().split('T')[0]} className="form-input lg:w-[250px] w-2/3" />
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
                                    User
                                </label>
                                <Select placeholder="Select or search user..." className="form-input flex-1 p-0 border-white" value={selectedUser} options={users} onChange={handleUserChange} />
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
                            <div className="text-lg">Payment Details:</div>
                            <div className="flex items-center mt-4">
                                <label htmlFor="acno" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">
                                    Account Number
                                </label>
                                <input id="acno" type="text" name="acno" className="form-input flex-1" placeholder="Enter Account Number" />
                            </div>
                            <div className="flex items-center mt-4">
                                <label htmlFor="bank-name" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">
                                    Bank Name
                                </label>
                                <input id="bank-name" type="text" name="bank-name" className="form-input flex-1" placeholder="Enter Bank Name" />
                            </div>
                            
                           
                            <div className="flex items-center mt-4">
                                <label htmlFor="is-fixed" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">
                                    Fixed
                                </label>
                                <input
                                    style={{ width: '40px', height: '40px', borderRadius: '8px' }}
                                    id="is-fixed"
                                    type="checkbox"
                                    name="is-fixed"
                                    className="form-input form-checkbox text-success rounded-full"
                                    checked={isChecked}
                                    onChange={(e) => setIsChecked(e.target.checked)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-8 px-4">
                    <div className="flex items-center mb-4">
                        <label htmlFor="scanner" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">
                            Scan Product
                        </label>
                        <input
                            id="scanner"
                            type="text"
                            value={scannedProductId}
                            onChange={(e) => setScannedProductId(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleScanProduct()}
                            className="form-input flex-1"
                            placeholder="Scan or enter product ID"
                        />
                        <button type="button" className="btn btn-primary ml-2" onClick={handleScanProduct}>
                            Add
                        </button>
                    </div>
                    <div className="flex items-center mb-4">
                        <label htmlFor="product-select" className="ltr:mr-2 rtl:ml-2 w-1/3 mb-0">
                            Select Products
                        </label>
                        <Select
                            id="product-select"
                            placeholder="Select multiple products..."
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
                                    <th className="px-4 py-2 text-left border-b">Item</th>
                                    <th className="px-4 py-2 text-left border-b w-24">Quantity</th>
                                    <th className="px-4 py-2 text-left border-b w-24">Price</th>
                                    <th className="px-4 py-2 text-left border-b">Total</th>
                                    <th className="px-4 py-2 text-left border-b w-12"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length <= 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-2 text-center font-semibold border-b">
                                            No Items Available
                                        </td>
                                    </tr>
                                )}
                                {items.map((item) => (
                                    <tr key={item.id} className="border-b">
                                        <td className="px-4 py-2">
                                            <div className="font-medium">{item.title}</div>
                                            {item.description && <div className="text-sm text-gray-500 mt-1">{item.description}</div>}
                                        </td>
                                        <td className="px-4 py-2">{item.quantity}</td>
                                        <td className="px-4 py-2">${item.rate.toFixed(2)}</td>
                                        <td className="px-4 py-2">${(item.quantity * item.rate).toFixed(2)}</td>
                                        <td className="px-4 py-2">
                                            <button type="button" onClick={() => removeItem(item)} className="text-red-500 hover:text-red-700">
                                                <IconX className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-gray-50">
                                    <td colSpan={3} className="px-4 py-2 text-right font-semibold">
                                        Total:
                                    </td>
                                    <td className="px-4 py-2 font-semibold">
                                        $
                                        {items
                                            .reduce((sum: number, item: { quantity: number; rate: number }) => {
                                                return sum + item.quantity * item.rate;
                                            }, 0)
                                            .toFixed(2)}
                                    </td>

                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-between sm:flex-row flex-col mt-6 px-4">
                        {/* Remove the "Add Item" button from here */}
                        <div className="sm:mb-0 mb-6">
                            {/* Button removed */}
                        </div>
                        <div className="sm:w-2/5">
                            <div className="flex items-center justify-between">
                                <div>Subtotal</div>
                                <div>${subtotal.toFixed(2)}</div>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center">
                                    <span>Tax(%)</span>
                                    <input type="number" className="form-input w-20 ml-2" min="0" value={tax} onChange={(e) => setTax(Number(e.target.value))} />
                                </div>
                                <div>${taxAmount.toFixed(2)}</div>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center">
                                    <span>Shipping Rate($)</span>
                                    <input type="number" className="form-input w-20 ml-2" min="0" value={shippingRate} onChange={(e) => setShippingRate(Number(e.target.value))} />
                                </div>
                                <div>${shippingRate.toFixed(2)}</div>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center">
                                    <span>Discount(%)</span>
                                    <input type="number" className="form-input w-20 ml-2" min="0" max="100" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
                                </div>
                                <div>${discountAmount.toFixed(2)}</div>
                            </div>
                            <div className="flex items-center justify-between mt-4 font-semibold">
                                <div>Total</div>
                                <div>${total.toFixed(2)}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-8 px-4">
                    <label htmlFor="notes">Notes</label>
                    <textarea id="notes" name="notes" className="form-textarea min-h-[130px]" placeholder="Notes...."></textarea>
                </div>
                <div className="mt-8 px-4 flex justify-end">
                    <button type="button" className="btn btn-primary">
                        Create Invoice
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Add;