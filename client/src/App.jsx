import { Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';

export default function App() {
    return (
        <>
            <Navbar />
            <main className="page">
                <div className="container">
                    <Outlet />
                </div>
            </main>
        </>
    );
}
