// import { createContext, useContext, useState, useEffect } from "react";
// import {jwtDecode} from "jwt-decode";

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);

//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (token) {
//       try {
//         const decoded = jwtDecode(token);
//         const now = Date.now() / 1000;
//         if (decoded.exp > now) setUser({ ...decoded, token });
//         else localStorage.removeItem("token");
//       } catch {
//         localStorage.removeItem("token");
//       }
//     }
//   }, []);

//   const login = (token) => {
//     localStorage.setItem("token", token);
//     const decoded = jwtDecode(token);
//     setUser({ ...decoded, token });
//   };

//   const logout = () => {
//     localStorage.removeItem("token");
//     setUser(null);
//   };

//   return (
//     <AuthContext.Provider value={{ user, login, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);


import { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(undefined); // undefined = loading, null = not logged

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const decoded = jwtDecode(token);
      if (decoded?.exp && decoded.exp * 1000 > Date.now()) {
        setUser({ ...decoded, token });
      } else {
        localStorage.removeItem("token");
        setUser(null);
      }
    } catch {
      localStorage.removeItem("token");
      setUser(null);
    }
  }, []);

  const login = (token) => {
    try {
      localStorage.setItem("token", token);
      const decoded = jwtDecode(token);
      setUser({ ...decoded, token });
    } catch {
      setUser(null);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
