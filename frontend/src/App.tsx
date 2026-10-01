import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Home from "@/pages/Home";
import AdminLogin from "@/pages/AdminLogin";
import Admin from "@/pages/Admin";
import Portal from "@/pages/Portal";
import MyPhotos from "@/pages/MyPhotos";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/portal" element={<Portal />} />
        <Route path="/my-photos" element={<MyPhotos />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Home />} />
      </Routes>
      <Toaster />
    </>
  );
}
