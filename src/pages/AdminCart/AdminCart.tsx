import { DataTable } from 'mantine-datatable';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import IconRefresh from '../../components/Icon/IconRefresh';
import { toast, Toaster } from 'sonner';

const Products = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
     const [search, setSearch] = useState('');
    const [totalRecords, setTotalRecords] = useState(0);
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [recordsData, setRecordsData] = useState([]);

    const backendUrl = import.meta.env.VITE_API_URL;

    console.log('records data:', recordsData); // Log the records data for debugging

    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');

    useEffect(() => {
        if (!token || userRole !== 'admin') {
            navigate('/auth/cover-login');
            return;
        }
    }, [navigate]);

    useEffect(() => {
        dispatch(setPageTitle('Admin Cart'));
    }, [dispatch]);

    const refreshProducts = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${backendUrl}/from-sql/get-products`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            // Display the full response data in a Sonner toast
            toast.success('Products fetched successfully!', {
                description: JSON.stringify(response.data, null, 2),
            });
        } catch (error) {
            console.error('Error fetching products:', error);
            // Display error message in a Sonner toast
            toast.error('Failed to fetch products', {
                description: error instanceof Error ? error.message : String(error),
            });
        } finally {
            fetchProducts();
            setLoading(false);
        }
    };

  const fetchProducts = async (pageNum = page, size = pageSize, searchQuery = search) => {
    setLoading(true);
    try {
        const response = await axios.get(`${backendUrl}/admin/get-mongo-products`, {
            headers: { Authorization: `Bearer ${token}` },
            params: {
                page: pageNum,
                pageSize: size,
                search: searchQuery,
            },
        });
        const { products, total } = response.data;
        const transformedProducts = products.map((product: any) => ({
            id: product._id || null,
            stockCode: product.stock_code,
            description: product.description || 'N/A',
            grossWeight: parseFloat(product.gross_weight),
            stoneWeight: parseFloat(product.stone_weight),
            netWeight: parseFloat(product.net_weight),
            pureWeight: parseFloat(product.pure_weight),
            purity: product.purity || 'N/A',
            karat: product.karat,
            mkg_rate: product.mkg_rate,
            mkg_amount: parseFloat(product.mkg_amount),
            netAmount: parseFloat(product.net_amount),
            barcode: product.barcode,
            divisionms: product.divisionms,
            division_code: product.division_code,
            branch_code: product.branch_code,
            design_code: product.design_code,
            currency_code: product.currency_code,
            color: product.color,
            total_grosswt: parseFloat(product.total_grosswt) || 0,
            price_1: product.price_1,
            price_2: product.price_2,
            price_3: product.price_3,
            loose_totalwt: product.loose_totalwt,
            color_totalwt: product.color_totalwt,
            pearl_totalwt: product.pearl_totalwt,
            type_code: product.type_code,
            category_code: product.category_code,
            subcategory_code: product.subcategory_code,
            brand_code: product.brand_code,
            country_code: product.country_code,
            product_collection: product.product_collection,
            sub_collection: product.sub_collection,
            clarity: product.clarity,
            cert_date: product.cert_date,
            supplier_code: product.supplier_code,
            cost_code: product.cost_code,
            loose_totalamount: product.loose_totalamount,
            balance_qty: product.balance_qty,
            item_count: product.item_count,
        }));
        setProducts(transformedProducts);
        setTotalRecords(total);
    } catch (error) {
        toast.error('Error fetching products');
    } finally {
        setLoading(false);
    }
};

    // Fetch products from the backend
   useEffect(() => {
        fetchProducts();
    }, [page, pageSize, search, backendUrl, token]);

    // Handle search input
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1); // Reset to first page on new search
    };

    // Update recordsData when products or pagination changes
    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecordsData(products.slice(from, to));
    }, [products, page, pageSize]);

    return (
        <div>
            <Toaster />
            <div className="panel mt-6">
               <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        {/* Title Section */}
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
            </div>
            <div>
                <h5 className="font-semibold text-xl text-gray-900 dark:text-white leading-tight">
                    Products Management
                </h5>
            </div>
        </div>

        {/* Actions Section */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            {/* Search Input */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    type="text"
                    placeholder="Search by stock code or description"
                    value={search}
                    onChange={handleSearch}
                    className="w-full sm:w-80 pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400
                             focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400
                             transition-colors duration-200 shadow-sm"
                />
                {search && (
                    <button
                        onClick={() => setSearch('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Refresh Button */}
            <button
                disabled={loading}
                onClick={refreshProducts}
                className={`inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 
                         text-white font-medium rounded-lg shadow-md hover:shadow-lg transform transition-all duration-200 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800
                         ${loading 
                             ? 'opacity-75 cursor-not-allowed' 
                             : 'hover:from-blue-700 hover:to-blue-800 hover:-translate-y-0.5 active:translate-y-0'
                         }`}
            >
                {loading ? (
                    <>
                        <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Refreshing...</span>
                    </>
                ) : (
                    <>
                        <IconRefresh className="w-5 h-5 mr-2" />
                        <span>Refresh Stocks</span>
                    </>
                )}
            </button>
        </div>
    </div>
</div>

                <div className="datatables">
                  <DataTable
    noRecordsText="No products available"
    highlightOnHover
    className="whitespace-nowrap table-hover"
    records={products}
    columns={[
        { accessor: 'stockCode', title: 'Stock Code' },
        { accessor: 'description', title: 'Description' },
        { accessor: 'grossWeight', title: 'Gross Weight (g)' },
        { accessor: 'stoneWeight', title: 'Stone Weight (g)' },
        { accessor: 'netWeight', title: 'Net Weight (g)' },
        { accessor: 'pureWeight', title: 'Pure Weight (g)' },
        { accessor: 'purity', title: 'Purity' },
        { accessor: 'karat', title: 'Karat' },
        { accessor: 'mkg_rate', title: 'Making Rate' },
        { accessor: 'mkg_amount', title: 'Making Charges (₹)' },
        { accessor: 'netAmount', title: 'Net Amount (₹)' },
        { accessor: 'barcode', title: 'Barcode' },
        { accessor: 'divisionms', title: 'Division MS' },
        { accessor: 'division_code', title: 'Division Code' },
        { accessor: 'branch_code', title: 'Branch Code' },
        { accessor: 'design_code', title: 'Design Code' },
        { accessor: 'currency_code', title: 'Currency Code' },
        { accessor: 'color', title: 'Color' },
        { accessor: 'total_grosswt', title: 'Total Gross Weight (g)' },
        { accessor: 'price_1', title: 'Price 1' },
        { accessor: 'price_2', title: 'Price 2' },
        { accessor: 'price_3', title: 'Price 3' },
        { accessor: 'loose_totalwt', title: 'Loose Total Weight' },
        { accessor: 'color_totalwt', title: 'Color Total Weight' },
        { accessor: 'pearl_totalwt', title: 'Pearl Total Weight' },
        { accessor: 'type_code', title: 'Type Code' },
        { accessor: 'category_code', title: 'Category Code' },
        { accessor: 'subcategory_code', title: 'Subcategory Code' },
        { accessor: 'brand_code', title: 'Brand Code' },
        { accessor: 'country_code', title: 'Country Code' },
        { accessor: 'product_collection', title: 'Product Collection' },
        { accessor: 'sub_collection', title: 'Sub Collection' },
        { accessor: 'clarity', title: 'Clarity' },
        { accessor: 'cert_date', title: 'Cert Date' },
        { accessor: 'supplier_code', title: 'Supplier Code' },
        { accessor: 'cost_code', title: 'Cost Code' },
        { accessor: 'loose_totalamount', title: 'Loose Total Amount' },
        { accessor: 'balance_qty', title: 'Balance Qty' },
        { accessor: 'item_count', title: 'Item Count' },
    ]}
    totalRecords={totalRecords}
    recordsPerPage={pageSize}
    page={page}
    onPageChange={setPage}
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
