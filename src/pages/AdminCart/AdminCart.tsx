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
        dispatch(setPageTitle('Admin Cart'));
    }, [dispatch]);

    // Fetch products from the backend
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get(`${backendUrl}/admin/get-mongo-products`, {
                    headers: {
                        Authorization: `Bearer ${token}`, // Pass the token in the Authorization header
                    },
                });
                console.log('Response from server:', response.data); // Log the response data
    
                // Transform the data to include all details from the server
                const transformedProducts = response.data.products.map((product:any) => ({
                    id: product.product_id,
                    name: product.name,
                    sku: product.sku,
                    weightInGrams: product.weight, // Convert oz to grams
                    karat: product.karat,
                    purity: parseFloat(product.purity),
                    pricePerGram: parseFloat(product.price),
                    totalPrice: parseFloat(product.final_price),
                    
                    addedDate: new Date(product.createdAt).toLocaleDateString('en-GB').replace(/\//g, '/ '),
                    remarks: product.description || "N/A",
                    category: product.category || "N/A",
                    subCategory: product.sub_category || "N/A",
                    designCode: product.design_code || "N/A",
                    discount: product.discount || "0",
                    gender: product.gender || "Unisex",
                    goldType: product.gold_type || "N/A",
                    hallmark: product.hallmark ? "Yes" : "No",
                    hasStones: product.has_stones ? "Yes" : "No",
                    stoneType: product.stone_type || "N/A",
                    stoneWeight: product.stone_weight || "N/A",
                    style: product.style || "N/A",
                    size: product.size || "N/A",
                    dimensions: `${product.length || "N/A"} x ${product.width || "N/A"} x ${product.height || "N/A"}`,
                }));
    
                setProducts(transformedProducts);
                console.log('Fetched products:', transformedProducts); // Log the fetched products
            } catch (error) {
                console.error('Error fetching products:', error);
            }
        };
    
        fetchProducts();
    }, [backendUrl, token]);
    // Update recordsData when products or pagination changes
    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecordsData(products.slice(from, to));
    }, [products, page, pageSize]);

    return (
        <div>
            <div className="panel mt-6">
                <h5 className="font-semibold text-lg dark:text-white-light mb-5">Products of admin cart</h5>
                <div className="datatables">
                <DataTable
    noRecordsText="No products available"
    highlightOnHover
    className="whitespace-nowrap table-hover"
    records={recordsData}
    columns={[
        { accessor: 'name', title: 'Name' },
        { accessor: 'sku', title: 'SKU' },
        { accessor: 'weightInGrams', title: 'Weight (g)' },
        { accessor: 'karat', title: 'Karat' },
        { accessor: 'purity', title: 'Purity (%)' },
        { accessor: 'pricePerGram', title: 'Price' },
        { accessor: 'totalPrice', title: 'Total Price' },
        { accessor: 'addedDate', title: 'Added Date' },
        { accessor: 'remarks', title: 'Remarks' },
        { accessor: 'category', title: 'Category' },
        { accessor: 'subCategory', title: 'Sub-Category' },
        { accessor: 'designCode', title: 'Design Code' },
        { accessor: 'discount', title: 'Discount (%)' },
        { accessor: 'gender', title: 'Gender' },
        { accessor: 'goldType', title: 'Gold Type' },
        { accessor: 'hallmark', title: 'Hallmark' },
        { accessor: 'hasStones', title: 'Has Stones' },
        { accessor: 'stoneType', title: 'Stone Type' },
        { accessor: 'stoneWeight', title: 'Stone Weight' },
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