import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t">
      <div className="container py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Noexplorer. Private by design.</p>
        <nav className="flex items-center gap-4">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <Link to="/search" className="hover:text-foreground transition-colors">Search</Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
