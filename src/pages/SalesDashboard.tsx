import React, { useEffect, useState } from 'react';
import { User, Phone, Mail, Package, MapPin, Award, TrendingUp } from 'lucide-react';
import axios from 'axios';
import { use } from 'i18next';
import { useNavigate } from 'react-router-dom';

interface SalesPerson {
    _id: string;
    name: string;
    email: string;
    phone: string;
    image?: {
        url?: string;
        key?: string;
    };
    salespersonId: string;
    assignedProducts: Array<{ productId: string }>;
    selledProducts: Array<{
        invoiceNumber: string;
        invoiceDate: Date;
        userName: string;
        userEmail: string;
        userPhone: string;
        userLocation: string;
        goldRate: number;
        subtotal: number;
        tax: number;
        discount: number;
        total: number;
        items: Array<{
            productId: string;
            stock_code: string;
            description: string;
            gross_rate: number;
            stone_weight: number;
            net_weight: number;
            pure_weight: number;
            mkg_rate: number;
            mkg_amount: number;
            pure_rate: number;
            net_amount: number;
        }>;
    }>;
    returnAppliedProducts: Array<{ productId: string }>;
    pendingProducts: Array<{ productId: string }>;
    assignedLocation?: string;
    createdAt: Date;
    updatedAt: Date;
}

const SalesDashboard: React.FC = () => {
    const navigate = useNavigate();
    const backendUrl = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('authToken') || '';

    const [salespersons, setSalespersons] = useState<SalesPerson[]>([]);
    // const [salesPeople] = useState<SalesPerson[]>([
    //   {
    //     _id: "1",
    //     name: "Sarah Johnson",
    //     email: "sarah.j@btc.com",
    //     phone: "+1 (555) 123-4567",
    //     salespersonId: "BTC-A1B2",
    //     assignedProducts: [{ productId: "prod1" }, { productId: "prod2" }],
    //     selledProducts: [
    //       {
    //         invoiceNumber: "INV-001",
    //         invoiceDate: new Date("2024-01-15"),
    //         userName: "John Doe",
    //         userEmail: "john@example.com",
    //         userPhone: "+1234567890",
    //         userLocation: "New York",
    //         goldRate: 2000,
    //         subtotal: 15000,
    //         tax: 1500,
    //         discount: 500,
    //         total: 16000,
    //         items: []
    //       }
    //     ],
    //     returnAppliedProducts: [],
    //     pendingProducts: [{ productId: "prod3" }],
    //     assignedLocation: "North Region",
    //     createdAt: new Date("2024-01-01"),
    //     updatedAt: new Date("2024-01-20")
    //   }
    // ]);

    const fetchSalesPersons = async () => {
        try {
            const response = await axios.get(`${backendUrl}/admin/get-sales-persons`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log('Salespersons fetched:', response.data.salespersons);
            setSalespersons(response.data.salespersons);
        } catch (error) {
            console.error('Error fetching salespersons:', error);
        }
    };
    useEffect(() => {
        fetchSalesPersons();
    }, [backendUrl, token]);

    const getTotalSales = (person: SalesPerson) => {
        return person.selledProducts.reduce((sum, sale) => sum + sale.total, 0);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusColor = (assignedCount: number, pendingCount: number) => {
        if (pendingCount > 0) return 'bg-yellow-100 text-yellow-800';
        if (assignedCount > 0) return 'bg-green-100 text-green-800';
        return 'bg-gray-100 text-gray-800';
    };

    const getStatusText = (assignedCount: number, pendingCount: number) => {
        if (pendingCount > 0) return 'Pending';
        if (assignedCount > 0) return 'Active';
        return 'Idle';
    };

    return (
        <div className="mb-4 bg-gray-50 ">
            <div>
                {/* Header */}
                {/* <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Sales Team Dashboard</h1>
          <p className="text-gray-600 text-sm">Manage and monitor your sales team performance</p>
        </div> */}

                {/* Stats Overview */}
                {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Total Sales</p>
                <p className="text-lg font-bold text-gray-900">{salesPeople.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Active</p>
                <p className="text-lg font-bold text-gray-900">
                  {salesPeople.filter(sp => sp.assignedProducts.length > 0).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="h-4 w-4 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Products</p>
                <p className="text-lg font-bold text-gray-900">
                  {salesPeople.reduce((sum, sp) => sum + sp.assignedProducts.length, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Award className="h-4 w-4 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Total Sales</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(salesPeople.reduce((sum, sp) => sum + getTotalSales(sp), 0))}
                </p>
              </div>
            </div>
          </div>
        </div> */}

                {/* Sales People Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-5 gap-4 ">
                    {Array.isArray(salespersons) &&
                        salespersons.map((person) => (
                            <div key={person._id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-4 z-10">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center">
                                        {person.image && person.image.url ? (
                                            <img src={person.image.url} alt={person.name} className="w-8 h-8 rounded-full" />
                                        ) : (
                                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                                                {person.name
                                                    .split(' ')
                                                    .map((n) => n[0])
                                                    .join('')}
                                            </div>
                                        )}
                                        <div className="ml-2">
                                            <h3 className="font-semibold text-gray-900 text-sm truncate">{person.name}</h3>
                                            <p className="text-xs text-blue-600 font-medium">{person.salespersonId}</p>
                                        </div>
                                    </div>
                                    {/* <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(person.assignedProducts.length, person.pendingProducts.length)}`}>
                  {getStatusText(person.assignedProducts.length, person.pendingProducts.length)}
                </span> */}
                                </div>

                                {/* Contact Info */}
                                {/* <div className="space-y-1 mb-3">
                <div className="flex items-center text-xs text-gray-600">
                  <Mail className="h-3 w-3 mr-2 flex-shrink-0" />
                  <span className="truncate">{person.email}</span>
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <Phone className="h-3 w-3 mr-2 flex-shrink-0" />
                  <span className="truncate">{person.phone}</span>
                </div>
                {person.assignedLocation && (
                  <div className="flex items-center text-xs text-gray-600">
                    <MapPin className="h-3 w-3 mr-2 flex-shrink-0" />
                    <span className="truncate">{person.assignedLocation}</span>
                  </div>
                )}
              </div> */}

                                {/* Quick Stats */}
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    <div className="bg-gray-50 rounded p-2">
                                        <p className="text-xs text-gray-600">Assigned</p>
                                        <p className="text-sm font-bold text-gray-900">{person.assignedProducts.length}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded p-2">
                                        <p className="text-xs text-gray-600">Sold</p>
                                        <p className="text-sm font-bold text-gray-900">{person.selledProducts.reduce((total, sale) => total + (sale.items?.length || 0), 0)}</p>
                                    </div>
                                    <div className={`${person.pendingProducts.length > 0 ? 'bg-yellow-100 animate-pulse' : 'bg-gray-50'} rounded p-2`}>
                                        <p className="text-xs text-gray-600">Pending</p>
                                        <p className="text-sm font-bold text-orange-600">{person.pendingProducts.length}</p>
                                    </div>
                                    <div onClick={() => navigate(`/returncartofadmin`)} className={`${person.returnAppliedProducts.length > 0 ? 'bg-red-100 animate-pulse cursor-pointer' : 'bg-gray-50'} rounded p-2`}>
                                        <p className="text-xs text-gray-600">Returns</p>
                                        <p className="text-sm font-bold text-red-600">{person.returnAppliedProducts.length}</p>
                                    </div>
                                </div>

                                {/* Total Sales */}
                                {/* <div className="mb-3 p-2 bg-green-50 rounded">
                <p className="text-xs text-gray-600">Total Sales</p>
                <p className="text-sm font-bold text-green-700">{formatCurrency(getTotalSales(person))}</p>
              </div> */}

                                {/* Action Button */}
                                <button
                                    onClick={() => navigate(`/spprofile/${person._id}`)}
                                    className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium py-2 px-3 rounded-lg text-xs transition-colors duration-200"
                                >
                                    View Details
                                </button>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
};

export default SalesDashboard;
