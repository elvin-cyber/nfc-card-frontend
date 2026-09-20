import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="center-page">
      <div className="empty-icon">404</div>
      <h1>Page not found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <Link className="btn btn-primary" to="/login">Go to login</Link>
    </div>
  );
}