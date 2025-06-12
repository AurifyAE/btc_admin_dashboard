import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconPhone from '../../components/Icon/IconPhone';
import IconLockDots from '../../components/Icon/IconLockDots';
import axios from 'axios';

interface LoginErrors {
    phone?: string;
    password?: string;
}

const SalespersonLogin = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const backendUrl = import.meta.env.VITE_API_URL;

    // Form states
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [fieldError, setFieldError] = useState<LoginErrors>({});

    // Check for existing auth
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        const userRole = localStorage.getItem('userRole');

        if (token && userRole === 'salesperson') {
            navigate('/spprofile');
        }
    }, [navigate]);

    useEffect(() => {
        dispatch(setPageTitle('Salesperson Login'));
    }, [dispatch]);

    const validateFields = () => {
        const errors: LoginErrors = {};
        
        if (!phone.trim()) errors.phone = 'Phone number is required';
        if (!password.trim()) errors.password = 'Password is required';
        
        setFieldError(errors);
        return Object.keys(errors).length === 0;
    };

    const submitForm = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setFieldError({});

        if (!validateFields()) {
            return;
        }

        try {
            const response = await axios.post(`${backendUrl}/salesperson/sales-person-login`, {
                phone: phone.trim(),
                password: password.trim(),
            });

            if (response.status === 200) {
                const { token, salesperson } = response.data;
                localStorage.setItem('authToken', token);
                localStorage.setItem('userRole', 'salesperson');
                localStorage.setItem('userData', JSON.stringify(salesperson));
                navigate('/spprofile');
            }
        } catch (err) {
            if (axios.isAxiosError(err)) {
                if (err.response?.status === 400) {
                    setError('Phone number and password are required.');
                } else if (err.response?.status === 401) {
                    setError('Invalid credentials.');
                } else if (err.response?.status === 404) {
                    setError('Salesperson not found.');
                } else {
                    setError('An error occurred. Please try again.');
                }
            } else {
                setError('An unexpected error occurred.');
            }
        }
    };

    return (
        <div>
            <div className="absolute inset-0">
                <img src="/assets/images/auth/9975084.jpg" alt="image" className="h-full w-full object-cover" />
            </div>
            <div className="relative flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat px-6 py-10 dark:bg-[#060818] sm:px-16">
                <div className="relative flex w-full max-w-[1502px] flex-col justify-between overflow-hidden rounded-md bg-white/60 backdrop-blur-lg dark:bg-black/50 lg:min-h-[758px] lg:flex-row lg:gap-10 xl:gap-0">
                    <div className="relative hidden w-full items-center justify-center bg-[linear-gradient(225deg,rgba(255,215,0,0.5)_0%,rgba(184,134,11,1)_100%)] p-5 lg:inline-flex lg:max-w-[835px] xl:-ms-28 ltr:xl:skew-x-[14deg] rtl:xl:skew-x-[-14deg]">
                        <div className="absolute inset-y-0 w-8 from-[#b8860b]/10 via-transparent to-transparent ltr:-right-10 ltr:bg-gradient-to-r rtl:-left-10 rtl:bg-gradient-to-l xl:w-16 ltr:xl:-right-20 rtl:xl:-left-20"></div>
                        <div className="ltr:xl:-skew-x-[14deg] rtl:xl:skew-x-[14deg]">
                            <div className="mt-24 hidden w-full max-w-[430px] lg:block">
                                <img src="/assets/images/auth/loginImage.png" alt="Cover Image" className="w-full" />
                            </div>
                        </div>
                    </div>
                    <div className="relative flex w-full flex-col items-center justify-center gap-6 px-4 pb-16 pt-6 sm:px-6 lg:max-w-[667px]">
                        <div className="w-full max-w-[440px]">
                            <div className="mb-10">
                                <h1 className="text-3xl font-extrabold uppercase !leading-snug text-primary md:text-4xl">Salesperson Login</h1>
                                <p className="text-base font-bold leading-normal text-white-dark">Enter your phone number and password to login</p>
                            </div>
                            <form className="space-y-5 dark:text-white" onSubmit={submitForm}>
                                <div>
                                    <label htmlFor="phone">Phone Number</label>
                                    <div className="relative text-white-dark">
                                        <input
                                            id="phone"
                                            type="text"
                                            placeholder="Enter Phone Number"
                                            className={`form-input ps-10 placeholder:text-white-dark ${fieldError.phone ? 'border-red-500' : ''}`}
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                        />
                                        <span className="absolute start-4 top-1/2 -translate-y-1/2">
                                            <IconPhone fill={true} />
                                        </span>
                                    </div>
                                    {fieldError.phone && <p className="text-red-500 text-sm">{fieldError.phone}</p>}
                                </div>
                                <div>
                                    <label htmlFor="password">Password</label>
                                    <div className="relative text-white-dark">
                                        <input
                                            id="password"
                                            type="password"
                                            placeholder="Enter Password (Your Salesperson ID)"
                                            className={`form-input ps-10 placeholder:text-white-dark ${fieldError.password ? 'border-red-500' : ''}`}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <span className="absolute start-4 top-1/2 -translate-y-1/2">
                                            <IconLockDots fill={true} />
                                        </span>
                                    </div>
                                    {fieldError.password && <p className="text-red-500 text-sm">{fieldError.password}</p>}
                                </div>
                                {error && <p className="text-red-500 text-sm">{error}</p>}
                                <div className="flex flex-col sm:flex-row sm:gap-4">
                                    <button
                                        type="submit"
                                        className="btn btn-gradient mt-4 w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(67,97,238,0.44)]"
                                    >
                                        Sign in
                                    </button>
                                    {/* <button
                                        type="button"
                                        className="btn btn-outline-secondary mt-4 w-full uppercase"
                                        onClick={() => navigate('/login')}
                                    >
                                        Back to Login Options
                                    </button> */}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalespersonLogin;