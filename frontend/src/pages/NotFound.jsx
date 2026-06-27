import { Link } from 'react-router-dom';
import './NotFound.css';
import PageReveal from '../components/PageReveal';

export default function NotFound() {
    return (
        <PageReveal className="not-found-page">
            <div className="nf-code">404</div>
            <h2>Page Not Found</h2>
            <p>The page you're looking for doesn't exist or has been moved.</p>
            <Link to="/" className="btn-primary">Go Home</Link>
        </PageReveal>
    );
}
