import { DataTable } from 'mantine-datatable';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Products = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [recordsData, setRecordsData] = useState([]);

    const token = localStorage.getItem('authToken');

    const backendUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            navigate('/auth/cover-login'); // Redirect to home if token exists
        }
    }, [navigate]);

    useEffect(() => {
        dispatch(setPageTitle('Products'));
    }, [dispatch]);

    // Fetch products from the backend
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get(`${backendUrl}/admin/get-products`, {
                    headers: {
                        Authorization: `Bearer ${token}`, // Pass the token in the Authorization header
                    },
                });
                console.log('Response from server:', response.data); // Log the response data
    
                // Transform the data to include all details from the server
                const transformedProducts = response.data.products.map((product: any) => ({
                   
                    name: product.name,
                    sku: product.sku,
                    weight: product.weight, // Convert oz to grams
                    karat: product.karat,
                    purity: product.purity,
                    gold_rate: product.gold_rate,
                    final_price: product.final_price,
                    created_at: new Date(product.createdAt).toLocaleDateString('en-GB').replace(/\//g, '/ '),
                    description: product.description || null,
                    category: product.category || null,
                    sub_category: product.sub_category || null,
                    design_code: product.design_code || null,
                    discount: product.discount || null,
                    gender: product.gender || null,
                    gold_type: product.gold_type || null,
                    hallmark: product.hallmark,
                    has_stones: product.has_stones,
                    stone_type: product.stone_type || null,
                    stone_weight: product.stone_weight || null,
                    style: product.style || null,
                    size: product.size || null,
                    length: product.length || null,
                    width: product.width || null,
                    height: product.height || null,
                    stone_count: product.stone_count || null,
                    making_charges: product.making_charges || null,
                    making_charges_type: product.making_charges_type || null,
                    price: product.price || null,
                    updated_at: product.updated_at || null,
                }));
    
                setProducts(transformedProducts);
    console.log('Fetched products:', transformedProducts); // Log the fetched products
                // Call the function to copy products to MongoDB
                await copyProductsToMongoDB(transformedProducts);
            } catch (error) {
                console.error('Error fetching products:', error);
            }
        };
    
        fetchProducts();
    }, [backendUrl, token]);
    
    // Function to copy products from SQL to MongoDB
    const copyProductsToMongoDB = async (products: any[]) => {
        // console.log('Copying products to MongoDB...',products);
        try {
            const response = await axios.post(`${backendUrl}/admin/copy-products`,products, {
                headers: {
                    Authorization: `Bearer ${token}`, // Pass the token in the Authorization header
                },
            });
    
            console.log('Products copied to MongoDB:', response.data);
        } catch (error) {
            console.error('Error copying products to MongoDB:', error);
        }
    };
    // Update recordsData when products or pagination changes
    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecordsData(products.slice(from, to));
    }, [products, page, pageSize]);

    return (
        <div>
            <div className="panel mt-6">
                <h5 className="font-semibold text-lg dark:text-white-light mb-5">Products</h5>
                <div className="datatables">
                <DataTable
    noRecordsText="No products available"
    highlightOnHover
    className="whitespace-nowrap table-hover"
    records={recordsData}
    columns={[
        { accessor: 'name', title: 'Name' },
        { accessor: 'sku', title: 'SKU' },
        { accessor: 'weight', title: 'Weight (g)' },
        { accessor: 'karat', title: 'Karat' },
        { accessor: 'purity', title: 'Purity (%)' },
        { accessor: 'price', title: 'Price' },
        { accessor: 'final_price', title: 'Total Price' },
        { accessor: 'created_at', title: 'Added Date' },
        { accessor: 'description', title: 'Remarks' },
        { accessor: 'category', title: 'Category' },
        { accessor: 'sub_category', title: 'Sub-Category' },
        { accessor: 'design_code', title: 'Design Code' },
        { accessor: 'discount', title: 'Discount (%)' },
        { accessor: 'gender', title: 'Gender' },
        { accessor: 'gold_type', title: 'Gold Type' },
        { accessor: 'hallmark', title: 'Hallmark' },
        { accessor: 'has_stones', title: 'Has Stones' },
        { accessor: 'stone_type', title: 'Stone Type' },
        { accessor: 'stone_weight', title: 'Stone Weight' },
        { accessor: 'style', title: 'Style' },
        { accessor: 'size', title: 'Size' },
        { accessor: 'dimensions', title: 'Dimensions (L x W x H)' },
    ]}
    totalRecords={products.length}
    recordsPerPage={pageSize}
    page={page}
    onPageChange={(p) => setPage(p)}
    recordsPerPageOptions={PAGE_SIZES}
    onRecordsPerPageChange={setPageSize}
    minHeight={200}
    paginationText={({ from, to, totalRecords }) => `Showing ${from} to ${to} of ${totalRecords} entries`}
/>
                </div>
            </div>
        </div>
    );
};

export default Products;