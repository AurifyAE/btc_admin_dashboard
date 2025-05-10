import { useState, Fragment, useEffect } from 'react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconMapPin from '../../components/Icon/IconMapPin';
import IconSearch from '../../components/Icon/IconSearch';
import IconX from '../../components/Icon/IconX';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Contacts = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate()
    const backendUrl = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('authToken');

    const [locations, setLocations] = useState<any>([]);
    const [locationModal, setLocationModal] = useState(false);
    const [editIs, setEditIs] = useState(false);
    const [uid, setUid] = useState<any>(null);
    const [location, setLocation] = useState('');
    const [latitudeAndLongitude, setLatitudeAndLongitude] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            navigate('/auth/cover-login'); // Redirect to home if token exists
        }
    }, [navigate]);
    
    useEffect(() => {
        dispatch(setPageTitle('Contacts'));
        fetchLocations();
    }, [dispatch]);

    const openModal = () => {
        setLocationModal(true);
    };

    const closeModal = () => {
        setLocationModal(false);
        setLocation('');
        setLatitudeAndLongitude('');
        setUid(null);
        setEditIs(false);
    };

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

    const saveLocation = async () => {
        if (!location || !latitudeAndLongitude) {
            showMessage('All fields are required', 'error');
            return;
        }

        const url = editIs
            ? `${backendUrl}/admin/update-location/${uid}`
            : `${backendUrl}/admin/add-location`;

        const payload = { locationName: location, latitudeAndLongitude };
        const config = { headers: { Authorization: `Bearer ${token}` } };

        try {
            if (editIs) {
                await axios.put(url, payload, config);
                showMessage('Location updated successfully');
            } else {
                await axios.post(url, payload, config);
                showMessage('Location added successfully');
            }
            fetchLocations();
            closeModal();
        } catch (error) {
            console.error('Error saving location:', error);
            showMessage('Failed to save location', 'error');
        }
    };

    const editLocation = async (id: any) => {
        setUid(id);
        setEditIs(true);
        setLocationModal(true);
        try {
            const response = await axios.get(`${backendUrl}/admin/get-location/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setLocation(response.data.location.locationName);
            setLatitudeAndLongitude(response.data.location.latitudeAndLongitude);
        } catch (error) {
            console.error('Error fetching location:', error);
            showMessage('Failed to fetch location', 'error');
        }
    };

    const deleteLocation = async (id: any) => {
        try {
            const confirm = await Swal.fire({
                title: 'Are you sure?',
                text: 'You won’t be able to revert this!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, delete it!',
            });

            if (confirm.isConfirmed) {
                await axios.delete(`${backendUrl}/admin/delete-location/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                showMessage('Location deleted successfully');
                fetchLocations();
            }
        } catch (error) {
            console.error('Error deleting location:', error);
            showMessage('Failed to delete location', 'error');
        }
    };

    const showMessage = (msg: string = '', type: 'success' | 'error' | 'warning' | 'info' | 'question' = 'success') => {
        Swal.fire({
            toast: true,
            position: 'top',
            icon: type,
            title: msg,
            showConfirmButton: false,
            timer: 3000,
        });
    };

    const handleSearch = () => {
        if (!location.trim()) return;
        const query = encodeURIComponent(location.trim());
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
        window.open(mapUrl, '_blank');
    };

    return (
        <div>
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h2 className="text-xl">Locations</h2>
                <button type="button" className="btn btn-primary" onClick={openModal}>
                    <IconMapPin className="ltr:mr-2 rtl:ml-2" />
                    Add Location
                </button>
            </div>

            <div className="mt-5 panel p-0 border-0 overflow-hidden">
                <div className="table-responsive">
                    <table className="table-striped table-hover">
                        <thead>
                            <tr>
                                <th>Location</th>
                                <th>Latitude and Longitude</th>
                                <th className="!text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {locations.map((location: any) => (
                                <tr key={location._id}>
                                    <td>{location.locationName}</td>
                                    <td>{location.latitudeAndLongitude}</td>
                                    <td>
                                        <div className="flex gap-4 items-center justify-center">
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => editLocation(location._id)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => deleteLocation(location._id)}
                                            >
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

            <Transition appear show={locationModal} as={Fragment}>
                <Dialog as="div" open={locationModal} onClose={closeModal} className="relative z-[51]">
                    <TransitionChild
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
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
                                        {editIs ? 'Edit Location' : 'Add Location'}
                                    </div>
                                    <div className="p-5">
                                        <form autoComplete='off'>
                                            <div className="mb-5">
                                                <label htmlFor="location">Location</label>
                                                <div className="flex">
                                                    <input
                                                        id="location"
                                                        type="text"
                                                        placeholder="Enter location"
                                                        className="form-input ltr:rounded-r-none rtl:rounded-l-none"
                                                        value={location}
                                                        onChange={(e) => setLocation(e.target.value)}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn btn-primary ltr:rounded-l-none rtl:rounded-r-none"
                                                        onClick={handleSearch}
                                                    >
                                                        <IconSearch className="ltr:mr-2 rtl:ml-2" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mb-5">
                                                <label htmlFor="latitudeAndLongitude">Latitude and Longitude</label>
                                                <input
                                                    id="latitudeAndLongitude"
                                                    type="text"
                                                    placeholder="Enter Latitude and Longitude"
                                                    className="form-input"
                                                    value={latitudeAndLongitude}
                                                    onChange={(e) => setLatitudeAndLongitude(e.target.value)}
                                                />
                                            </div>
                                            <div className="flex justify-end items-center mt-8">
                                                <button type="button" className="btn btn-outline-danger" onClick={closeModal}>
                                                    Cancel
                                                </button>
                                                <button type="button" className="btn btn-primary ltr:ml-4 rtl:mr-4" onClick={saveLocation}>
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