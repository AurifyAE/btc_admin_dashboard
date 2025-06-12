import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import IconUser from '../../components/Icon/IconUser';
import Swal from 'sweetalert2';
import { ChevronLeft, Package, User, Check, X, RefreshCw, Sparkles, Search, ArrowLeft, Scan, Camera } from 'lucide-react';

type SalespersonOption = {
    label: string;
    value: string;
    image: {
        url: string;
    };
    phone: string;
    name: string;
    email: string;
    salespersonId: string;
    _id: string;
};

const Infobox = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const barcodeInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        dispatch(setPageTitle('Product Assignment'));
    }, []);

    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    
    useEffect(() => {
        if (!token || userRole !== 'admin') {
            navigate('/auth/cover-login');
            return;
        }
    }, [navigate]);

    type Product = {
        _id: string;
        description: string;
        stock_code: string;
        barcode?: string;
        [key: string]: any;
    };

    const [allProducts, setAllProducts] = useState<Product[]>([]); 
    const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
    const [salespersons, setSalespersons] = useState([]);
    const [selectedSalesperson, setSelectedSalesperson] = useState<SalespersonOption | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [barcodeValue, setBarcodeValue] = useState('');
    const [isBarcodeMode, setIsBarcodeMode] = useState(true);
    const [scanHistory, setScanHistory] = useState<string[]>([]);

    const backendUrl = import.meta.env.VITE_API_URL;

    const fetchSalesPersons = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${backendUrl}/admin/get-sales-persons`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const transformedSalespersons = response.data.salespersons.map((person: any) => ({
                value: person._id,
                label: `${person.name} - ${person.salespersonId}`,
                ...person,
            }));

            setSalespersons(transformedSalespersons);
        } catch (error) {
            console.error('Error fetching salespersons:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${backendUrl}/admin/get-mongo-products`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const transformedProducts = response.data.products.map((product: any) => ({
                value: product._id,
                label: `${product.description} [${product.stock_code}]`,
                ...product,
            }));

            setAllProducts(transformedProducts);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSalesPersons();
    }, [backendUrl, token]);

    useEffect(() => {
        if (selectedSalesperson) {
            fetchProducts();
        }
    }, [selectedSalesperson]);

    // Barcode scanning focus management
    useEffect(() => {
        if (isBarcodeMode && barcodeInputRef.current) {
            barcodeInputRef.current.focus();
        }
    }, [isBarcodeMode]);

    // Auto-focus barcode input when in barcode mode
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (isBarcodeMode && selectedSalesperson && barcodeInputRef.current) {
                // Prevent other inputs from getting focus when in barcode mode
                if (e.target !== barcodeInputRef.current) {
                    e.preventDefault();
                    barcodeInputRef.current.focus();
                }
            }
        };

        if (isBarcodeMode) {
            document.addEventListener('keydown', handleGlobalKeyDown);
            return () => document.removeEventListener('keydown', handleGlobalKeyDown);
        }
    }, [isBarcodeMode, selectedSalesperson]);

    const handleSalespersonSelect = (salesperson: SalespersonOption) => {
        setSelectedSalesperson(salesperson);
    setIsBarcodeMode(true);
        setSelectedProducts([]);
    };

    const handleProductSelect = (product: any) => {
        const isAlreadySelected = selectedProducts.some((p: any) => p._id === product._id);
        
        if (isAlreadySelected) {
            setSelectedProducts(selectedProducts.filter((p: any) => p._id !== product._id));
        } else {
            setSelectedProducts([...selectedProducts, product]);
        }
    };

    const handleBarcodeSearch = (barcode: string) => {
        if (!barcode.trim()) return;

        // Find product by barcode (assuming barcode matches stock_code or a barcode field)
        const foundProduct = allProducts.find((product: any) => 
            product.stock_code === barcode || 
            product.barcode === barcode ||
            product.description.toLowerCase().includes(barcode.toLowerCase())
        );

        if (foundProduct) {
            const isAlreadySelected = selectedProducts.some((p: any) => p._id === foundProduct._id);
            
            if (!isAlreadySelected) {
                setSelectedProducts([...selectedProducts, foundProduct]);
                showMessage(`Product "${foundProduct?.description}" added successfully!`, 'success');
                
                // Add to scan history
                setScanHistory(prev => [barcode, ...prev.slice(0, 9)]); // Keep last 10 scans
            } else {
                showMessage(`Product "${foundProduct?.description}" is already selected!`, 'warning');
            }
        } else {
            showMessage(`No product found with barcode: ${barcode}`, 'error');
        }
    };

    const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (barcodeValue.trim()) {
                handleBarcodeSearch(barcodeValue.trim());
                setBarcodeValue(''); // Clear the input after scanning
            }
        }
    };

    const handleProductSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && filteredProducts.length > 0) {
            const firstProduct = filteredProducts[0];
            const isAlreadySelected = selectedProducts.some((p: any) => p._id === firstProduct._id);
            if (!isAlreadySelected) {
                setSelectedProducts([...selectedProducts, firstProduct]);
                setProductSearchTerm(''); // Clear the input after adding
                showMessage(`Product "${firstProduct.description}" added!`, 'success');
            }
        }
    };

    const toggleBarcodeMode = () => {
        setIsBarcodeMode(!isBarcodeMode);
        setBarcodeValue('');
        if (!isBarcodeMode) {
            showMessage('Barcode scanning mode activated! Focus will be maintained on barcode input.', 'info');
        }
    };

    const handleAssignProducts = () => {
        if (!selectedSalesperson || selectedProducts.length === 0) {
            showMessage('Please select both products and a salesperson to assign', 'warning');
            return;
        }
    
        console.log('Assigning products:', selectedProducts, 'to salesperson:', selectedSalesperson);
    
        const requestForAssignProduct = async () => {
            setIsLoading(true);
            try {
                await axios.post(
                    `${backendUrl}/admin/req-assign-products`,
                    {
                        salespersonId: selectedSalesperson._id,
                        productIds: selectedProducts.map((product: { _id: string }) => product._id),
                    },
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
    
                showMessage('Products assigned successfully!', 'success');
                setSelectedProducts([]);
                setScanHistory([]); // Clear scan history after successful assignment
                fetchProducts();
            } catch (error) {
                console.error('Error assigning products:', error);
                showMessage('Failed to assign products', 'error');
            } finally {
                setIsLoading(false);
            }
        };
    
        requestForAssignProduct();
    };

    const resetSelection = () => {
        setSelectedSalesperson(null);
        setSelectedProducts([]);
        setProductSearchTerm('');
        setSearchTerm('');
        setBarcodeValue('');
        setIsBarcodeMode(false);
        setScanHistory([]);
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

    // Filter salespersons based on search term
    const filteredSalespersons = salespersons.filter((person: any) => 
        person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.salespersonId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filter products based on search term
    const filteredProducts = allProducts.filter((product: any) => 
        product.description.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        product.stock_code.toLowerCase().includes(productSearchTerm.toLowerCase())
    );

    return (
        <div className="relative min-h-screen  p-6 z-10">
            {/* Header Section */}
            {/* <div className="max-w-7xl mx-auto mb-8">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-full shadow-lg mb-6">
                        <Sparkles className="w-5 h-5" />
                        <h1 className="text-2xl font-bold">Product Assignment Center</h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
                        Assign products to sales representatives with our streamlined interface
                    </p>
                </div>
            </div> */}

            <div className="max-w-7xl mx-auto">
                {!selectedSalesperson ? (
                    /* Salesperson Selection View */
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <User className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Select Sales Representative</h2>
                        </div>

                        {/* Search Bar */}
                        <div className="relative mb-8">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search sales representatives by name, ID, or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors duration-200"
                            />
                        </div>

                        {/* Salesperson Cards Grid */}
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                                <span className="ml-3 text-gray-600 dark:text-gray-300">Loading sales representatives...</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredSalespersons.map((salesperson: any) => (
                                    <div
                                        key={salesperson._id}
                                        onClick={() => handleSalespersonSelect(salesperson)}
                                        className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-600 cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-blue-500 hover:scale-105 transform"
                                    >
                                        {/* Profile Image */}
                                        <div className="flex justify-center mb-4">
                                            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white dark:border-gray-600 shadow-lg">
                                                {salesperson?.image?.url ? (
                                                    <img 
                                                        alt="Profile" 
                                                        src={salesperson.image.url} 
                                                        className="w-full h-full object-cover" 
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700">
                                                        <IconUser className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Profile Info */}
                                        <div className="text-center">
                                            <h3 className="font-bold text-gray-800 dark:text-white text-lg mb-2 truncate">
                                                {salesperson.name}
                                            </h3>
                                            <div className="space-y-1 text-sm">
                                                <p className="text-gray-600 dark:text-gray-300 truncate">
                                                    🆔 {salesperson.salespersonId}
                                                </p>
                                                <p className="text-gray-600 dark:text-gray-300 truncate">
                                                    📞 {salesperson.phone}
                                                </p>
                                                <p className="text-gray-600 dark:text-gray-300 truncate">
                                                    ✉️ {salesperson.email}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Select Button */}
                                        <div className="mt-4 text-center">
                                            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                                                <User className="w-4 h-4" />
                                                Select
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {filteredSalespersons.length === 0 && !isLoading && (
                            <div className="text-center py-12">
                                <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-gray-400 text-lg">No sales representatives found</p>
                                <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Try adjusting your search terms</p>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Product Assignment View */
                    <div className="space-y-8">
                        {/* Selected Salesperson Header */}
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={resetSelection}
                                        className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-500 transition-colors duration-200"
                                    >
                                        <ArrowLeft className="w-6 h-6" />
                                    </button>
                                    
                                    <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white dark:border-gray-600 shadow-lg">
                                        {selectedSalesperson?.image?.url ? (
                                            <img 
                                                alt="Profile" 
                                                src={selectedSalesperson.image.url} 
                                                className="w-full h-full object-cover" 
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700">
                                                <IconUser className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                                            Assign Products to {selectedSalesperson.name}
                                        </h2>
                                        <p className="text-gray-600 dark:text-gray-300">
                                            ID: {selectedSalesperson.salespersonId} • 📞 {selectedSalesperson.phone}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {selectedProducts.length > 0 && (
                                        <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-full font-semibold">
                                            {selectedProducts.length} selected
                                        </div>
                                    )}
                                    
                                    <button
                                        onClick={handleAssignProducts}
                                        disabled={selectedProducts.length === 0 || isLoading}
                                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Check className="w-5 h-5" />
                                        )}
                                        Assign Products
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Barcode Scanner Section */}
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                        isBarcodeMode ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-orange-500 to-red-600'
                                    }`}>
                                        <Scan className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Barcode Scanner</h3>
                                    {isBarcodeMode && (
                                        <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
                                            ACTIVE
                                        </div>
                                    )}
                                </div>
                                
                                <button
                                    onClick={toggleBarcodeMode}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                                        isBarcodeMode
                                            ? 'bg-red-500 hover:bg-red-600 text-white'
                                            : 'bg-green-500 hover:bg-green-600 text-white'
                                    }`}
                                >
                                    <Camera className="w-4 h-4" />
                                    {isBarcodeMode ? 'Stop Scanning' : 'Start Scanning'}
                                </button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Barcode Input */}
                                <div>
                                    <div className="relative">
                                        <Scan className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            ref={barcodeInputRef}
                                            type="text"
                                            placeholder={isBarcodeMode ? "Scan barcode or type manually..." : "Enter barcode manually..."}
                                            value={barcodeValue}
                                            onChange={(e) => setBarcodeValue(e.target.value)}
                                            onKeyDown={handleBarcodeKeyDown}
                                            className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none transition-colors duration-200 ${
                                                isBarcodeMode
                                                    ? 'border-green-500 focus:border-green-600 bg-green-50 dark:bg-green-900/20'
                                                    : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
                                            }`}
                                            autoFocus={isBarcodeMode}
                                        />
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                        {isBarcodeMode ? 'Focus is locked on this input for continuous scanning' : 'Press Enter to search after typing'}
                                    </p>
                                </div>

                                {/* Scan History */}
                                <div>
                                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Recent Scans</h4>
                                    <div className="max-h-32 overflow-y-auto custom-scrollbar">
                                        {scanHistory.length > 0 ? (
                                            <div className="space-y-2">
                                                {scanHistory.map((scan, index) => (
                                                    <div key={index} className="flex items-center gap-2 text-sm">
                                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                        <span className="text-gray-600 dark:text-gray-400">{scan}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-400 dark:text-gray-500 text-sm">No scans yet</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Product Selection Interface */}
                        <div className="grid lg:grid-cols-2 gap-8 z-9">
                            {/* Available Products */}
                            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                        <Package className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Available Products</h3>
                                </div>

                                {/* Product Search */}
                                <div className="relative mb-6">
                                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Search products..."
                                        value={productSearchTerm}
                                        onChange={(e) => setProductSearchTerm(e.target.value)}
                                        onKeyDown={handleProductSearchKeyDown}
                                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors duration-200"
                                        disabled={isBarcodeMode}
                                    />
                                </div>

                                {/* Product List */}
                                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                                    {isLoading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                                            <span className="ml-2 text-gray-600 dark:text-gray-300">Loading products...</span>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {filteredProducts.map((product: any) => {
                                                const isSelected = selectedProducts.some((p: any) => p._id === product._id);
                                                return (
                                                    <div
                                                        key={product._id}
                                                        onClick={() => !isBarcodeMode && handleProductSelect(product)}
                                                        className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${
                                                            isBarcodeMode 
                                                                ? 'cursor-not-allowed opacity-50'
                                                                : 'cursor-pointer'
                                                        } ${
                                                            isSelected
                                                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                                                : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                                        }`}
                                                    >
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                            isSelected
                                                                ? 'bg-green-500'
                                                                : 'bg-gradient-to-r from-blue-500 to-purple-600'
                                                        }`}>
                                                            {isSelected ? (
                                                                <Check className="w-5 h-5 text-white" />
                                                            ) : (
                                                                <Package className="w-5 h-5 text-white" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-gray-800 dark:text-white truncate">
                                                                {product.description}
                                                            </p>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                SKU: {product.stock_code}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Selected Products */}
                            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 ">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                                            <Check className="w-6 h-6 text-white" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Selected Products</h3>
                                    </div>
                                    {selectedProducts.length > 0 && (
                                        <button
                                            onClick={() => setSelectedProducts([])}
                                            className="text-red-500 hover:text-red-700 transition-colors duration-200 text-sm font-semibold"
                                        >
                                            Clear All
                                        </button>
                                    )}
                                </div>

                                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                                    {selectedProducts.length > 0 ? (
                                        <div className="space-y-3">
                                            {selectedProducts.map((product: any, index: number) => (
                                                <div key={index} className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                                                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <Check className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-gray-800 dark:text-white truncate">
                                                            {product.description}
                                                        </p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            SKU: {product.stock_code}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleProductSelect(product);
                                                        }}
                                                        className="w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-200"
                                                    >
                                                        <X className="w-4 h-4 text-white" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-64 text-center">
                                            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                                <Package className="w-12 h-12 text-gray-400" />
                                            </div>
                                            <p className="text-gray-500 dark:text-gray-400 text-lg">No products selected</p>
                                            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                                                {isBarcodeMode ? 'Scan barcodes to add products' : 'Click on products from the left to select them'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 4px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
                    border-radius: 4px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(to bottom, #2563eb, #7c3aed);
                }
            `}</style>
        </div>
    );
};

export default Infobox;