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

const Profile = () => {
    const { id: paramId } = useParams(); // Get the ID from URL parameters
    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    const dispatch = useDispatch();
    const backendUrl = import.meta.env.VITE_API_URL;
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [salesperson, setSalesperson] = useState<any>(null);
    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl' ? true : false;
    
    useEffect(() => {
        // Check if user is either a salesperson or an admin
        if (!token || (userRole !== 'salesperson' && userRole !== 'admin')) {
            navigate('/auth/cover-login');
            return;
        }
    }, [navigate, token, userRole]);

    const fetchUserById = async (userId:any) => {
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
    // Helper function to render product lists
    const renderProductList = (products: any[], emptyMessage: string) => {
        if (!products || products.length === 0) {
            return (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    {emptyMessage || "No products available"}
                </div>
            );
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
            return (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    {emptyMessage || "No products available"}
                </div>
            );
        }

        return (
            <div className="table-responsive">
                <table className="table-striped w-full">
                    <thead>
                        <tr>
                            <th className="px-4 py-2 text-left">Description</th>
                            <th className="px-4 py-2 text-left">Stock Code</th>
                            <th className="px-4 py-2 text-left">MKG Rate</th>
                            <th className="px-4 py-2 text-left">MKG Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((item, index) => (
                            <tr key={index}>
                                <td className="px-4 py-2">{item.description || 'N/A'}</td>
                                <td className="px-4 py-2">{item.stock_code || item.sku || 'N/A'}</td>
                                <td className="px-4 py-2">{item.mkg_rate || 'N/A'}</td>
                                <td className="px-4 py-2">{item.mkg_amount || 'N/A'}</td>
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
                                <img 
                                    src={salesperson?.image?.url || '/assets/images/profile-default.png'} 
                                    alt="Profile" 
                                    className="w-24 h-24 rounded-full object-cover mb-5" 
                                />
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
                                        <span className="whitespace-nowrap">
                                            {salesperson.assignedLocation.locationName || 'No location assigned'}
                                        </span>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>

                    {/* Products Information Panel */}
                    <div className="panel lg:col-span-2 xl:col-span-3">
                        <div className="mb-5">
                            <h5 className="font-semibold text-lg dark:text-white-light">Products Overview</h5>
                        </div>
                        
                        <div className="mb-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                            <div className="panel bg-primary/10 dark:bg-primary/20">
                                <div className="flex flex-col">
                                    <h5 className="text-lg font-semibold mb-3">Assigned Products</h5>
                                    <p className="text-3xl font-bold">{salesperson?.assignedProducts?.length || 0}</p>
                                </div>
                            </div>
                            
                            <div className="panel bg-warning/10 dark:bg-warning/20">
                                <div className="flex flex-col">
                                    <h5 className="text-lg font-semibold mb-3">Pending Products</h5>
                                    <p className="text-3xl font-bold">{salesperson?.pendingProducts?.length || 0}</p>
                                </div>
                            </div>
                            
                            <div className="panel bg-danger/10 dark:bg-danger/20">
                                <div className="flex flex-col">
                                    <h5 className="text-lg font-semibold mb-3">Return Applied</h5>
                                    <p className="text-3xl font-bold">{salesperson?.returnAppliedProducts?.length || 0}</p>
                                </div>
                            </div>
                            
                            <div className="panel bg-success/10 dark:bg-success/20">
                                <div className="flex flex-col">
                                    <h5 className="text-lg font-semibold mb-3">Sold Products</h5>
                                    <p className="text-3xl font-bold">{salesperson?.selledProducts?.length || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Product Details Sections */}
                <div className="grid grid-cols-1 gap-5">
                    {/* Assigned Products Section */}
                    <div className="panel">
                        <div className="flex items-center justify-between mb-5">
                            <h5 className="font-semibold text-lg dark:text-white-light">Assigned Products</h5>
                        </div>
                        {renderProductList(salesperson?.assignedProducts, "No products have been assigned yet.")}
                    </div>

                    {/* Pending Products Section */}
                    <div className="panel">
                        <div className="flex items-center justify-between mb-5">
                            <h5 className="font-semibold text-lg dark:text-white-light">Pending Products</h5>
                        </div>
                        {renderProductList(salesperson?.pendingProducts, "No pending products.")}
                    </div>

                    {/* Return Applied Products Section */}
                    <div className="panel">
                        <div className="flex items-center justify-between mb-5">
                            <h5 className="font-semibold text-lg dark:text-white-light">Return Applied Products</h5>
                        </div>
                        {renderProductList(salesperson?.returnAppliedProducts, "No return applications.")}
                    </div>

                    {/* Sold Products Section */}
                    <div className="panel">
                        <div className="flex items-center justify-between mb-5">
                            <h5 className="font-semibold text-lg dark:text-white-light">Sold Products</h5>
                        </div>
                        {renderSoldProductList(salesperson?.selledProducts, "No products have been sold yet.")}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;