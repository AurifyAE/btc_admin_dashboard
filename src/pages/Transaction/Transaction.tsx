import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import Select from 'react-select';
import IconUser from '../../components/Icon/IconUser';
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
};

const Infobox = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        dispatch(setPageTitle('Checkbox Table'));
    }, []); // Added dependency array to prevent infinite re-renders

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            navigate('/auth/cover-login'); // Redirect to login if token doesn't exist
        }
    }, [navigate]);

    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [allProducts, setAllProducts] = useState([]); // Store the original list of products
    const [selectedProducts, setSelectedProducts] = useState([]); // Store selected products
    const [salespersons, setSalespersons] = useState([]);
    const [selectedSalesperson, setSelectedSalesperson] = useState<SalespersonOption | null>(null);
    const token = localStorage.getItem('authToken');
    const backendUrl = import.meta.env.VITE_API_URL;

    const fetchSalesPersons = async () => {
        try {
            const response = await axios.get(`${backendUrl}/admin/get-sales-persons`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Transform salespersons data for react-select
            const transformedSalespersons = response.data.salespersons.map((person: any) => ({
                value: person._id,
                label: `${person.name} - ${person.salespersonId}`, // Display name and email for better identification
                ...person, // Include all salesperson details
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
                value: product._id, // Use _id for the value to ensure consistency
                label: `${product.name} [${product.sku}]`, // Add SKU in brackets
                ...product, // Include all product details
            }));

            setAllProducts(transformedProducts);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    useEffect(() => {
        fetchSalesPersons();
        fetchProducts();
    }, [backendUrl, token]);

    const handleProductChange = (selected: any) => {
        setSelectedProducts(selected || []); // Update selected products, handle null case
    };

    const handleSalespersonChange = (selected: any) => {
        setSelectedSalesperson(selected); // Update selected salesperson
    };

    const handleAssignProducts = () => {
        if (!selectedSalesperson || selectedProducts.length === 0) {
            alert('Please select both products and a salesperson to assign');
            return;
        }

        // Here you would implement the API call to assign products to the salesperson
        console.log('Assigning products:', selectedProducts, 'to salesperson:', selectedSalesperson);

        // Example of how you might structure the API call (uncomment and implement as needed)
        /*
        const assignProducts = async () => {
            try {
                await axios.post(
                    `${backendUrl}/admin/assign-products-to-salesperson`,
                    {
                        salespersonId: selectedSalesperson.value,
                        productIds: selectedProducts.map(product => product.value)
                    },
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                alert('Products assigned successfully!');
                // Optionally reset selections or refresh data
            } catch (error) {
                console.error('Error assigning products:', error);
                alert('Failed to assign products');
            }
        };
        
        assignProducts();
        */
    };

    return (
        <div>
            <div className="pt-5 grid lg:grid-cols-2 grid-cols-1 gap-6">
                {/* Infobox-1 */}
                <div className="panel" id="infobox_1">
                    <h1 className="text-2xl font-bold mb-4">Choose Products</h1>
                    <Select closeMenuOnSelect={false} isMulti options={allProducts} value={selectedProducts} onChange={handleProductChange} placeholder="Select or search products..." className="mb-6" />
                </div>

                {/* Infobox-2 */}
                <div className="panel" id="infobox_2">
                    <h1 className="text-2xl font-bold mb-4">Choose Sales Person</h1>
                    <Select value={selectedSalesperson} options={salespersons} onChange={handleSalespersonChange} placeholder="Select or search salesperson..." className="mb-6" />

                    {selectedSalesperson && (
                        <div className="mb-5 flex items-center justify-center">
                            <div className="max-w-[42rem] w-full bg-white shadow-[4px_6px_10px_-3px_#bfc9d4] rounded border border-white-light dark:border-[#1b2e4b] dark:bg-[#191e3a] dark:shadow-none">
                                <div className="flex flex-row items-center p-6 gap-6">
                                    {/* Image Section */}
                                    <div className="w-[180px] h-[180px] flex-shrink-0 overflow-hidden rounded object-cover border border-white-light dark:border-[#1b2e4b]">
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
            </div>

            <div className="mt-6">
                <button type="button" className="btn btn-info w-full" onClick={handleAssignProducts} disabled={!selectedSalesperson || selectedProducts.length === 0}>
                    Assign Products to {selectedSalesperson ? `${selectedSalesperson.name} - ${selectedSalesperson.salespersonId}` : 'Salesperson'}
                </button>
            </div>
        </div>
    );
};

export default Infobox;
