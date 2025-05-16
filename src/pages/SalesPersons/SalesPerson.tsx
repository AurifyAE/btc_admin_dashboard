import axios from 'axios';
import { useState, Fragment, useEffect } from 'react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconUserPlus from '../../components/Icon/IconUserPlus';
import IconX from '../../components/Icon/IconX';
import IconUser from '../../components/Icon/IconUser';
import { useNavigate } from 'react-router-dom';

const Contacts = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const backendUrl = import.meta.env.VITE_API_URL;

    // State variables
    const [addContactModal, setAddContactModal] = useState(false);
    const [salespersons, setSalespersons] = useState<any[]>([]);
    const [name, setName] = useState('');
    const [editIs, setEditIs] = useState(false);
    const [email, setEmail] = useState('');
    const [uid, setUid] = useState('');
    const [phone, setPhone] = useState('');
    const [assignedLocation, setAssignedLocation] = useState<string>('');
    const [locations, setLocations] = useState<any[]>([]);
    const [image, setImage] = useState<File | null>(null);
    const [contacts, setContacts] = useState([]);
    const [params, setParams] = useState({
        id: null,
        name: '',
        email: '',
        phone: '',
        assignedLocation: '',
    });
    const [search, setSearch] = useState('');

    // Validation states
    const [emailError, setEmailError] = useState('');
    const [phoneError, setPhoneError] = useState('');

    // Fetch data on component mount
    useEffect(() => {
        dispatch(setPageTitle('Sales Persons'));
        // fetchContacts();
        fetchSalesPersons();
        fetchLocations();
    }, []);

    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');

    useEffect(() => {
        if (!token || userRole !== 'admin') {
            navigate('/auth/cover-login');
            return;
        }
    }, [navigate]);

    // Fetch locations
    const fetchLocations = async () => {
        try {
            const response = await axios.get(`${backendUrl}/admin/get-locations`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setLocations(response.data.locations);
        } catch (error) {
            console.error('Error fetching locations:', error);
            showMessage('Failed to fetch locations', 'error');
        }
    };

    // Fetch salespersons
    const fetchSalesPersons = async () => {
        try {
            const response = await axios.get(`${backendUrl}/admin/get-sales-persons`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSalespersons(response.data.salespersons);
        } catch (error) {
            console.error('Error fetching salespersons:', error);
            showMessage('Failed to fetch salespersons', 'error');
        }
    };

    // Validate email
    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            setEmailError('Email is required');
            return false;
        } else if (!emailRegex.test(email)) {
            setEmailError('Please enter a valid email address');
            return false;
        } else {
            setEmailError('');
            return true;
        }
    };

    // Validate phone
    const validatePhone = (phone: string) => {
        // Regex for phone - allows different formats including international
        const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
        if (!phone) {
            setPhoneError('Phone number is required');
            return false;
        } else if (!phoneRegex.test(phone)) {
            setPhoneError('Please enter a valid phone number');
            return false;
        } else {
            setPhoneError('');
            return true;
        }
    };

    // Handle email change with validation
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);
        validateEmail(value);
    };

    // Handle phone change with validation
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPhone(value);
        validatePhone(value);
    };

    // Edit modal
    const editModal = async (id: any) => {
        setEditIs(true);
        setAddContactModal(true);
        setUid(id);
        // Reset validation errors
        setEmailError('');
        setPhoneError('');

        try {
            const response = await axios.get(`${backendUrl}/admin/get-sales-person/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const { name, email, phone, assignedLocation } = response.data.salesperson;
            setName(name);
            setEmail(email);
            setPhone(phone);
            setAssignedLocation(assignedLocation._id); // Assuming assignedLocation is an object with _id
        } catch (error) {
            console.error('Error fetching contact:', error);
            showMessage('Failed to fetch contact', 'error');
        }
    };

    // Save salesperson
    const saveSalesPerson = async () => {
        // Validate all fields before submission
        const isEmailValid = validateEmail(email);
        const isPhoneValid = validatePhone(phone);

        if (!name) {
            showMessage('Name is required.', 'error');
            return;
        }

        if (!assignedLocation) {
            showMessage('Location is required.', 'error');
            return;
        }

        if (!isEmailValid || !isPhoneValid) {
            showMessage('Please correct the errors before submitting.', 'error');
            return;
        }

        const url = editIs ? `${backendUrl}/admin/update-sales-person/${uid}` : `${backendUrl}/admin/add-sales-person`;

        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('phone', phone);
        formData.append('assignedLocation', assignedLocation);

        if (image) {
            formData.append('image', image); // Make sure `image` is a File, not FileList
        }

        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            },
        };

        try {
            if (editIs) {
                await axios.put(url, formData, config);
                showMessage('Salesperson updated successfully');
            } else {
                await axios.post(url, formData, config);
                showMessage('Salesperson created successfully');
            }

            setEditIs(false);
            setName('');
            setEmail('');
            setPhone('');
            setAssignedLocation('');
            setImage(null);
            // Reset validation errors
            setEmailError('');
            setPhoneError('');
            fetchSalesPersons();
            setAddContactModal(false);
        } catch (error) {
            console.error('Error saving salesperson:', error);
            showMessage('Failed to save salesperson', 'error');
        }
    };

    // Delete salesperson
    const deleteSalesperson = async (id: any) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: 'This action will delete the salesperson permanently.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel',
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`${backendUrl}/admin/delete-sales-person/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                showMessage('Salesperson deleted successfully.');
                fetchSalesPersons();
            } catch (error) {
                console.error('Error deleting contact:', error);
                showMessage('Failed to delete salesperson.', 'error');
            }
        }
    };

    // Open modal
    const openModal = (contact = null) => {
        if (contact) {
            setParams(contact);
        } else {
            setParams({
                id: null,
                name: '',
                email: '',
                phone: '',
                assignedLocation: '',
            });
        }

        // Reset form fields and validation errors
        setName('');
        setEmail('');
        setPhone('');
        setAssignedLocation('');
        setImage(null);
        setEmailError('');
        setPhoneError('');
        setEditIs(false);
        setAddContactModal(true);
    };

    // Close modal
    const closeModal = () => {
        setAddContactModal(false);
    };

    // Show message
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
console.log('Salespersons:', salespersons);
    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h2 className="text-xl">Sales Persons</h2>
                <button type="button" className="btn btn-primary" onClick={() => openModal()}>
                    <IconUserPlus className="ltr:mr-2 rtl:ml-2" />
                    Add Sales Person
                </button>
            </div>

            {/* Table */}
            <div className="mt-5 panel p-0 border-0 overflow-hidden">
                <div className="table-responsive">
                    <table className="table-striped table-hover">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>ID</th>
                                <th>Product in hand</th>
                                <th>Pending to approve</th>
                                <th>In Return</th>
                                <th className="!text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {salespersons?.map((person: any) => (
                                <tr key={person?._id}>
                                    <td>
                                        <div className="flex items-center w-max">
                                            {person?.image?.url ? (
                                                // Render the image if the URL exists
                                                <div className="w-max">
                                                    <img src={person.image.url} className="h-8 w-8 rounded-full object-cover ltr:mr-2 rtl:ml-2" alt={`${person.name}'s avatar`} />
                                                </div>
                                            ) : (
                                                // Fallback if no image is available
                                                <div className="border border-gray-300 dark:border-gray-800 rounded-full p-2 ltr:mr-2 rtl:ml-2">
                                                    <IconUser className="w-4.5 h-4.5" />
                                                </div>
                                            )}
                                            <div>{person.name}</div>
                                        </div>
                                    </td>
                                    <td>{person?.email}</td>
                                    <td>{person?.phone}</td>
                                    {/* Access the specific property of assignedLocation */}
                                    {/* <td>{person?.assignedLocation?.locationName || 'N/A'}</td> */}
                                    <td>{person?.salespersonId}</td>
                                    <td>{person?.assignedProducts.length}</td>
                                    <td>{person?.pendingProducts.length}</td>
                                    <td>{person?.returnAppliedProducts.length}</td>
                                    <td>
                                        <div className="flex gap-4 items-center justify-center">
                                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => navigate(`/spprofile/${person._id}`)}>
                                                View
                                            </button>

                                            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => editModal(person._id)}>
                                                Edit
                                            </button>
                                            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => deleteSalesperson(person._id)}>
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            <Transition appear show={addContactModal} as={Fragment}>
                <Dialog as="div" open={addContactModal} onClose={closeModal} className="relative z-[51]">
                    <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-[black]/60" />
                    </TransitionChild>
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center px-4 py-8">
                            <TransitionChild
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <DialogPanel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-lg text-black dark:text-white-dark">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="absolute top-4 ltr:right-4 rtl:left-4 text-gray-400 hover:text-gray-800 dark:hover:text-gray-600 outline-none"
                                    >
                                        <IconX />
                                    </button>
                                    <div className="text-lg font-medium bg-[#fbfbfb] dark:bg-[#121c2c] ltr:pl-5 rtl:pr-5 py-3 ltr:pr-[50px] rtl:pl-[50px]">
                                        {editIs ? 'Edit Sales Person' : 'Add Sales Person'}
                                    </div>
                                    <div className="p-5">
                                        <form autoComplete="off">
                                            <div className="mb-5">
                                                <label htmlFor="name">Name</label>
                                                <input id="name" type="text" placeholder="Enter Name" className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
                                            </div>
                                            <div className="mb-5">
                                                <label htmlFor="email">Email</label>
                                                <input
                                                    id="email"
                                                    type="email"
                                                    placeholder="Enter Email"
                                                    className={`form-input ${emailError ? 'border-danger' : ''}`}
                                                    value={email}
                                                    onChange={handleEmailChange}
                                                    onBlur={() => validateEmail(email)}
                                                />
                                                {emailError && <span className="text-danger text-xs mt-1">{emailError}</span>}
                                            </div>
                                            <div className="mb-5">
                                                <label htmlFor="phone">Phone</label>
                                                <input
                                                    id="phone"
                                                    type="text"
                                                    placeholder="Enter Phone"
                                                    className={`form-input ${phoneError ? 'border-danger' : ''}`}
                                                    value={phone}
                                                    onChange={handlePhoneChange}
                                                    onBlur={() => validatePhone(phone)}
                                                />
                                                {phoneError && <span className="text-danger text-xs mt-1">{phoneError}</span>}
                                            </div>
                                            <div className="mb-5">
                                                <label htmlFor="assignedLocation">Location</label>
                                                <select id="assignedLocation" className="form-input" value={assignedLocation} onChange={(e) => setAssignedLocation(e.target.value)}>
                                                    <option value="">Select Location</option>
                                                    {locations.map((location) => (
                                                        <option key={location._id} value={location._id}>
                                                            {location.locationName}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="mb-5">
                                                <label htmlFor="image">Profile Image</label>
                                                <input id="image" type="file" accept="image/*" className="form-input" onChange={(e) => setImage(e.target.files?.[0] || null)} />
                                            </div>
                                            <div className="flex justify-end items-center mt-8">
                                                <button type="button" className="btn btn-outline-danger" onClick={closeModal}>
                                                    Cancel
                                                </button>
                                                <button type="button" className="btn btn-primary ltr:ml-4 rtl:mr-4" onClick={saveSalesPerson}>
                                                    {editIs ? 'Update' : 'Add'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
};

export default Contacts;
