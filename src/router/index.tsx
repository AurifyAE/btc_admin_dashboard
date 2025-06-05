import { createBrowserRouter } from 'react-router-dom';
import BlankLayout from '../components/Layouts/BlankLayout';
import DefaultLayout from '../components/Layouts/DefaultLayout';
import { routes } from './routes';

const finalRoutes = routes.map((route) => {
    return {
        ...route,
        element: route.layout === 'blank' ? <BlankLayout>{route.element}</BlankLayout> : <DefaultLayout>{route.element}</DefaultLayout>,
    };
});

const router = createBrowserRouter(finalRoutes);

export default router;
// i have made some changes to the code to ensure that the layout is applied correctly based on the route's layout property. The BlankLayout is used for routes that require a blank layout, while the DefaultLayout is used for all other routes.
