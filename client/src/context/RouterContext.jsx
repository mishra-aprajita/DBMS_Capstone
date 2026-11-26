import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const RouterContext = createContext(null);

export function RouterProvider({ children }) {
  const [currentPath, setCurrentPath] = useState(window.location.pathname || '/');

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((to, options = {}) => {
    if (to === currentPath && !options.replace) return;
    if (options.replace) {
      window.history.replaceState({}, '', to);
    } else {
      window.history.pushState({}, '', to);
    }
    setCurrentPath(to);
    window.scrollTo(0, 0);
  }, [currentPath]);

  return (
    <RouterContext.Provider value={{ currentPath, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
}

export function Link({ to, children, className = '', onClick, ...props }) {
  const { navigate, currentPath } = useRouter();

  const handleClick = (e) => {
    if (onClick) onClick(e);
    if (!e.defaultPrevented && e.button === 0 && !e.metaKey && !e.altKey && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      navigate(to);
    }
  };

  const isActive = currentPath === to;
  const combinedClass = `${className} ${isActive ? 'active' : ''}`.trim();

  return (
    <a href={to} onClick={handleClick} className={combinedClass} {...props}>
      {children}
    </a>
  );
}
