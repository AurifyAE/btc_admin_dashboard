import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import Select from 'react-select';
import IconUser from '../../components/Icon/IconUser';
import Swal from 'sweetalert2';

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

    useEffect(() => {
        dispatch(setPageTitle('Transaction'));
    }, []);

    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    
    useEffect(() => {
        if (!token || userRole !== 'admin') {
            navigate('/auth/cover-login');
            return;
        }
    }, [navigate]);

    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [allProducts, setAllProducts] = useState([]); 
    const [selectedProducts, setSelectedProducts] = useState<any>([]);
    const [salespersons, setSalespersons] = useState([]);
    const [selectedSalesperson, setSelectedSalesperson] = useState<SalespersonOption | null>(null);
    const [showProductSelection, setShowProductSelection] = useState(false);

    const backendUrl = import.meta.env.VITE_API_URL;

    const fetchSalesPersons = async () => {
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
        }
    };

    const fetchProducts = async () => {
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

    const handleProductChange = (selected: any) => {
        setSelectedProducts(selected || []);
    };

    const handleSalespersonChange = (selected: any) => {
        setSelectedSalesperson(selected);
        if (selected) {
            setShowProductSelection(true);
        } else {
            setShowProductSelection(false);
            setSelectedProducts([]);
        }
    };

    const handleAssignProducts = () => {
        if (!selectedSalesperson || selectedProducts.length === 0) {
            showMessage('Please select both products and a salesperson to assign', 'warning');
            return;
        }
    
        console.log('Assigning products:', selectedProducts, 'to salesperson:', selectedSalesperson);
    
        const requestForAssignProduct = async () => {
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
    
                // Clear product selection but keep salesperson selected for convenience
                setSelectedProducts([]);
            } catch (error) {
                console.error('Error assigning products:', error);
                showMessage('Failed to assign products', 'error');
            }
        };
    
        requestForAssignProduct();
    };

    const resetSelection = () => {
        setSelectedSalesperson(null);
        setSelectedProducts([]);
        setShowProductSelection(false);
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
        <div>
            <div className="pt-5">
                {/* Step 1: Choose Salesperson First */}
                <div className="panel mb-6">
                    <h1 className="text-2xl font-bold mb-4">Choose Sales Person</h1>
                    <Select 
                        value={selectedSalesperson} 
                        options={salespersons} 
                        onChange={handleSalespersonChange} 
                        placeholder="Select or search salesperson..." 
                        className="mb-6"
                        isClearable
                    />

                    {selectedSalesperson && (
                        <div className="mb-5 flex items-center justify-center">
                            <div className="max-w-[32rem] w-full bg-white shadow-[4px_6px_10px_-3px_#bfc9d4] rounded border border-white-light dark:border-[#1b2e4b] dark:bg-[#191e3a] dark:shadow-none">
                                <div className="flex flex-row items-center p-6 gap-6">
                                    {/* Image Section */}
                                    <div className="w-[150px] h-[150px] flex-shrink-0 overflow-hidden rounded object-cover border border-white-light dark:border-[#1b2e4b]">
                                        {selectedSalesperson?.image?.url ? (
                                            <img alt="cover" src={selectedSalesperson.image.url} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                                <IconUser className="w-10 h-10 text-gray-500" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info Section */}
                                    <div className="flex-1">
                                        <h5 className="text-[#3b3f5c] text-xl font-semibold mb-2 dark:text-white-light">{selectedSalesperson.name}</h5>
                                        <p className="text-white-dark mb-1">{selectedSalesperson.phone}</p>
                                        <p className="text-white-dark">{selectedSalesperson.salespersonId}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Step 2: Choose Products (Only shown after selecting a salesperson) */}
                {showProductSelection && (
                    <div className="grid lg:grid-cols-2 grid-cols-1 gap-6">
                        {/* Product Selection Panel */}
                        <div className="panel" id="infobox_1">
                            <h1 className="text-2xl font-bold mb-4">Choose Products</h1>
                            <Select
                                closeMenuOnSelect={false}
                                isMulti
                                options={allProducts}
                                value={selectedProducts}
                                onChange={handleProductChange}
                                placeholder="Select or search products..."
                                className="mb-6"
                            />
                        </div>

                        {/* Selected Products Preview Panel */}
                        <div className="panel" id="infobox_2">
                            <h1 className="text-2xl font-bold mb-4">Selected Products</h1>
                            
                            {selectedProducts.length > 0 ? (
                                <div className="max-h-96 overflow-y-auto border rounded p-4">
                                    {selectedProducts.map((product: any, index: number) => (
                                        <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{product.description}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">SKU: {product.stock_code}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-40 border rounded">
                                    <p className="text-gray-500">No products selected yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 flex gap-4">
                    {selectedSalesperson && (
                        <button type="button" className="btn btn-danger" onClick={resetSelection}>
                            Reset Selection
                        </button>
                    )}
                    
                    {showProductSelection && (
                        <button 
                            type="button" 
                            className="btn btn-info flex-1" 
                            onClick={handleAssignProducts} 
                            disabled={!selectedSalesperson || selectedProducts.length === 0}
                        >
                            Assign {selectedProducts.length} Product{selectedProducts.length !== 1 ? 's' : ''} to {selectedSalesperson?.name}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Infobox;