import { useEffect } from "react";

interface UseSEOProps {
  title?: string;
  description?: string;
  canonical?: string;
}

export const useSEO = ({ title, description, canonical }: UseSEOProps) => {
  useEffect(() => {
    if (title) {
      document.title = title;
    }
    if (description) {
      const el = document.querySelector('meta[name="description"]');
      if (el) {
        el.setAttribute("content", description);
      }
    }
    if (canonical) {
      let link: HTMLLinkElement | null = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", canonical);
    }
  }, [title, description, canonical]);
};

export default useSEO;
