import React, { useState, useEffect, useRef } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Save, 
  X,
  TrendingUp,
  Tag,
  AlertCircle,
  Download,
  Wand2,
  Printer,
  ImagePlus,
  MapPin,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  FileText,
  CreditCard,
  Calendar,
  LogOut,
  Lock
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDVw6PYt7MyEF0Cx7IF_omsTxdvR2AgaUg",
  authDomain: "ra-invensys.firebaseapp.com",
  projectId: "ra-invensys",
  storageBucket: "ra-invensys.firebasestorage.app",
  messagingSenderId: "396025779943",
  appId: "1:396025779943:web:463c939159a7d77bb1b442",
  measurementId: "G-YPZ50YQR6E"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const SignaturePad = ({ title, subtitle, subtext }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCoordinates = (canvas, e) => {
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    setHasDrawn(true);
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const coords = getCoordinates(canvas, e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const coords = getCoordinates(canvas, e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  return (
    <div className="flex flex-col items-center">
      <p className="font-semibold text-slate-600 mb-4">{title}</p>
      <div className="relative border-2 border-slate-200 border-dashed rounded-xl bg-slate-50 print:border-none print:bg-transparent overflow-hidden">
        {!hasDrawn && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40 print:hidden">
            <span className="text-sm font-medium">Sign Here</span>
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={260}
          height={120}
          className="cursor-crosshair touch-none relative z-10 print:!w-[260px] print:!h-[120px]"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        ></canvas>
        <div className="absolute bottom-4 left-0 right-0 border-b border-slate-400 w-4/5 mx-auto pointer-events-none"></div>
      </div>
      <button 
        type="button" 
        onClick={clearCanvas} 
        className="mt-3 text-xs text-red-500 hover:text-red-700 print:hidden flex items-center gap-1 font-medium bg-red-50 px-2.5 py-1.5 rounded-md transition-colors"
      >
        <X size={14} /> Clear
      </button>
      <p className="mt-2 text-sm text-slate-800 font-bold">{subtitle}</p>
      {subtext && <p className="mt-0.5 text-xs text-slate-500">{subtext}</p>}
    </div>
  );
};

export default function App() {
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [isAdding, setIsAdding] = useState(false);
  const [logoError, setLogoError] = useState(false);
  
  // Mandatory Login at the beginning
  const [loggedInEmail, setLoggedInEmail] = useState("");
  const [loginInput, setLoginInput] = useState({ email: '', password: '' });
  
  const todayDate = new Date().toISOString().split('T')[0];

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const generateSKU = (brand, category) => {
    const brandMap = {
      'Louis Vuitton': 'LV',
      'Saint Laurent (YSL)': 'YSL',
      'Charles & Keith': 'CNK',
      'Bottega Veneta': 'BV',
      'Michael Kors': 'MK',
      'A.P.C.': 'APC'
    };
    
    const bPrefix = brandMap[brand] || brand.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
    const cPrefix = category.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
    const prefix = `${bPrefix}-${cPrefix}`;
    
    const matchingItems = inventory.filter(item => 
      item.sku && item.sku.toUpperCase().startsWith(prefix)
    );
    
    let maxNumber = 0;
    matchingItems.forEach(item => {
      const parts = item.sku.split('-');
      if (parts.length === 3) {
        const num = parseInt(parts[2], 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    });
    
    const nextNumber = maxNumber + 1;
    const formattedNumber = String(nextNumber).padStart(4, '0');
    
    return `${prefix}-${formattedNumber}`;
  };

  const [newItem, setNewItem] = useState({
    date: todayDate,
    dateOut: '',
    sku: '',
    brand: 'A.P.C.',
    name: '',
    category: 'Bags',
    stock: '',
    price: '',
    modalPrice: '',
    owner: '',
    ownerPhone: '',
    status: 'In'
  });

  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedItems, setSelectedItems] = useState([]);
  const [printItems, setPrintItems] = useState([]);
  const [printType, setPrintType] = useState('IN');
  const [attachmentImages, setAttachmentImages] = useState([]);

  // Invoice & Instalment States
  const [isInvoiceMode, setIsInvoiceMode] = useState(false);
  const [paymentType, setPaymentType] = useState('full'); 
  const [selectedTermIndex, setSelectedTermIndex] = useState('DP'); 
  const [invoiceDetails, setInvoiceDetails] = useState({
    buyerName: '',
    buyerPhone: '',
    buyerAddress: '',
    downPayment: '',
    tenorMonths: '3',
    dueDateFirst: todayDate
  });

  const adminEmails = [
    'elutaro.ai@gmail.com',
    'elrosamoda@gmail.com',
    'elisrosalinarais@gmail.com'
  ];
  const ADMIN_PASSWORD = 'Admin55555';

  const operatorEmails = [
    'operator@gmail.com'
  ];
  const OPERATOR_PASSWORD = 'operator123';

  const categories = [
    'Bags', 'Wallet', 'Card Holder', 'Pouch', 'Luggage', 
    'Shoes', 'Watches', 'Jewelery', 'Accessories', 
    'Hijab', 'Shirts', 'Dress', 'Mukena'
  ];

  const rawBrands = [
    'Louis Vuitton', 'Hermès', 'Chanel', 'Gucci', 'Prada', 'Dior', 'Fendi', 
    'Bottega Veneta', 'Saint Laurent (YSL)', 'Celine', 'Loewe', 'Balenciaga', 
    'Givenchy', 'Valentino Garavani', 'Versace', 'Goyard', 'The Row', 'Jacquemus', 
    'Miu Miu', 'Ferragamo', 'Coach', 'Kate Spade', 'Michael Kors', 'Marc Jacobs', 
    'Tory Burch', 'Longchamp', 'Furla', 'MCM', 'DKNY', 'Guess', 'Aldo', 
    'Charles & Keith', 'Polène', 'DeMellier', 'Strathberry', 'Mansur Gavriel', 
    'A.P.C.', 'Toteme'
  ];
  const brands = [...rawBrands].sort((a, b) => a.localeCompare(b));

  const statuses = [
    'In', 'Sold at Store', 'Sold by online', 'Returned to owner'
  ];

  useEffect(() => {
    signInAnonymously(auth).catch(() => {
      console.log("Using Database Test Mode.");
    });
  }, []);

  useEffect(() => {
    const inventoryRef = collection(db, 'inventory');
    const unsubscribe = onSnapshot(inventoryRef, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setInventory(items);
      setIsLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setErrorMsg("Failed to connect to database. Please check your internet connection.");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCustomLogin = (e) => {
    e.preventDefault();
    setErrorMsg("");
    
    const email = loginInput.email.toLowerCase().trim();
    const pass = loginInput.password.trim();

    if (adminEmails.includes(email) && pass === ADMIN_PASSWORD) {
      setLoggedInEmail(email);
      setLoginInput({ email: '', password: '' });
    } else if (operatorEmails.includes(email) && pass === OPERATOR_PASSWORD) {
      setLoggedInEmail(email);
      setLoginInput({ email: '', password: '' });
    } else {
      setErrorMsg("Invalid Email or Password. Please ensure your account is registered.");
    }
  };

  const handleLogout = async () => {
    setLoggedInEmail("");
    setSelectedItems([]);
  };

  const formatRupiah = (number) => {
    if (!number && number !== 0) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number);
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', { 
      day: 'numeric', month: 'short', year: 'numeric' 
    }).format(date);
  };

  const addMonthsToDateString = (dateStr, monthsToAdd) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    d.setMonth(d.getMonth() + monthsToAdd);
    return d.toISOString().split('T')[0];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'In': return 'bg-white text-slate-800 border-slate-300';
      case 'Sold at Store': return 'bg-[#d4af37] text-white border-[#c5a028] shadow-sm';
      case 'Sold by online': return 'bg-slate-900 text-white border-slate-900 shadow-sm';
      case 'Returned to owner': return 'bg-slate-100 text-slate-500 border-slate-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const currentEmail = loggedInEmail; 
  const isAdmin = currentEmail && adminEmails.includes(currentEmail);
  const isOperator = currentEmail && operatorEmails.includes(currentEmail);
  const canEdit = isAdmin;
  const canAdd = isAdmin || isOperator;

  const handlePrint = () => {
    if (window.self !== window.top) {
      setErrorMsg("Auto-print is restricted in this preview. Please press Ctrl+P (Windows) or Cmd+P (Mac) on your keyboard.");
    }
    window.print();
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachmentImages(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    setErrorMsg(""); 
    if (!canAdd || !newItem.name || !newItem.price || !newItem.stock) return;

    const finalSKU = newItem.sku || generateSKU(newItem.brand || brands[0], newItem.category);

    if (finalSKU) {
      const isDuplicate = inventory.some(item => item.sku && item.sku.toLowerCase() === finalSKU.toLowerCase());
      if (isDuplicate) {
        setErrorMsg(`SKU code "${finalSKU}" already exists. Please use a different code.`);
        return; 
      }
    }

    try {
      const inventoryRef = collection(db, 'inventory');
      await addDoc(inventoryRef, {
        date: newItem.date || todayDate,
        dateOut: newItem.dateOut || '',
        sku: finalSKU,
        brand: newItem.brand || brands[0],
        name: newItem.name,
        category: newItem.category,
        stock: Number(newItem.stock) || 0,
        price: Number(newItem.price) || 0,
        modalPrice: isAdmin ? (Number(newItem.modalPrice) || 0) : 0, 
        owner: newItem.owner || '',
        ownerPhone: newItem.ownerPhone || '',
        status: newItem.status || 'In',
        addedBy: currentEmail,
        createdAt: Date.now()
      });
      
      setNewItem({ 
        date: todayDate, dateOut: '', sku: '', brand: 'A.P.C.', name: '', category: 'Bags', 
        stock: '', price: '', modalPrice: '', owner: '', ownerPhone: '', status: 'In' 
      });
      setIsAdding(false);
      setCurrentPage(1);
    } catch (error) {
      console.error("Failed to add item:", error);
      setErrorMsg("Failed to save: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!canEdit) return;
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      const docRef = doc(db, 'inventory', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditFormData({
      date: item.date || todayDate,
      dateOut: item.dateOut || '',
      sku: item.sku || '',
      brand: item.brand || brands[0],
      name: item.name,
      category: item.category,
      stock: item.stock,
      price: item.price,
      modalPrice: item.modalPrice || '',
      owner: item.owner || '',
      ownerPhone: item.ownerPhone || '',
      status: item.status || 'In'
    });
  };

  const saveEdit = async (id) => {
    if (!canEdit) return;
    setErrorMsg(""); 

    if (editFormData.sku) {
      const isDuplicate = inventory.some(item => 
        item.id !== id && 
        item.sku && 
        item.sku.toLowerCase() === editFormData.sku.toLowerCase()
      );
      if (isDuplicate) {
        setErrorMsg(`SKU code "${editFormData.sku}" already exists. Please use a different code.`);
        return; 
      }
    }

    try {
      const docRef = doc(db, 'inventory', id);
      await updateDoc(docRef, {
        date: editFormData.date,
        dateOut: editFormData.dateOut,
        sku: editFormData.sku,
        brand: editFormData.brand,
        name: editFormData.name,
        category: editFormData.category,
        stock: Number(editFormData.stock) || 0,
        price: Number(editFormData.price) || 0,
        modalPrice: Number(editFormData.modalPrice) || 0,
        owner: editFormData.owner || '',
        ownerPhone: editFormData.ownerPhone || '',
        status: editFormData.status
      });
      setEditingId(null);
    } catch (error) {
      console.error("Failed to update:", error);
      setErrorMsg("Failed to update: " + error.message);
    }
  };

  const filteredInventory = inventory.filter(item => {
    const search = searchTerm.toLowerCase();
    return (
      (item.name || '').toLowerCase().includes(search) ||
      (item.brand || '').toLowerCase().includes(search) ||
      (item.category || '').toLowerCase().includes(search) ||
      (item.owner || '').toLowerCase().includes(search) ||
      (item.ownerPhone || '').includes(search)
    );
  });

  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInventory.slice(indexOfFirstItem, indexOfLastItem);

  const handleSelectAll = () => {
    if (selectedItems.length === filteredInventory.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredInventory.map(item => item.id));
    }
  };

  const handleSelect = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  const exportToCSV = () => {
    if (!isAdmin) {
      setErrorMsg("Only Administrators can download data.");
      return;
    }

    if (inventory.length === 0) {
      setErrorMsg("No data available to export.");
      return;
    }

    const headers = ['No', 'Date In', 'Date Out', 'Item Code', 'Brand', 'Item Name', 'Category', 'Stock', 'Modal Price', 'Selling Price', 'Profit', 'Owner', 'Owner Phone', 'Status'];
    const csvRows = [headers.join(',')];

    filteredInventory.forEach((item, index) => {
      const profit = (Number(item.price) || 0) - (Number(item.modalPrice) || 0);
      const row = [
        index + 1,
        item.date || '',
        item.dateOut || '',
        `"${item.sku || ''}"`,
        `"${item.brand || ''}"`,
        `"${item.name || ''}"`,
        `"${item.category || ''}"`,
        item.stock || 0,
        item.modalPrice || 0,
        item.price || 0,
        profit,
        `"${item.owner || ''}"`,
        `"${item.ownerPhone || ''}"`,
        `"${item.status || ''}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Inventory_Rosamoda_${todayDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalItems = inventory.length;
  const inStockItems = inventory.filter(i => i.status === 'In');
  const totalStock = inStockItems.reduce((sum, item) => sum + (Number(item.stock) || 0), 0);
  
  const soldItems = inventory.filter(i => i.status === 'Sold at Store' || i.status === 'Sold by online');
  const totalRevenue = soldItems.reduce((sum, item) => sum + ((Number(item.stock) || 0) * (Number(item.price) || 0)), 0);

  let roleText = "Guest (View Only)";
  let roleColor = "bg-gray-100 text-gray-700";
  let roleDot = "bg-gray-400";
  
  if (isAdmin) { 
    roleText = `Admin: ${currentEmail}`; 
    roleColor = "bg-[#f9f6f0] text-[#b8952d] border-[#e5d39e]";
    roleDot = "bg-[#d4af37]";
  } else if (isOperator) { 
    roleText = `Operator: ${currentEmail}`; 
    roleColor = "bg-slate-100 text-slate-700 border-slate-200";
    roleDot = "bg-slate-500";
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading Store...</p>
        </div>
      </div>
    );
  }

  // IF NOT LOGGED IN: SHOW LOGIN SCREEN
  if (!currentEmail) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="bg-white rounded-3xl p-8 md:p-10 max-w-md w-full shadow-2xl border border-slate-100">
          
          <div className="text-center mb-8 flex flex-col items-center">
            {!logoError ? (
              <img 
                src="https://drive.google.com/thumbnail?id=1l9Q891y6gdH6vXnT-B9H3LlToKcagtmw&sz=w500" 
                alt="Rosamoda Logo" 
                className="h-20 md:h-24 w-auto object-contain drop-shadow-sm mb-2"
                onError={() => setLogoError(true)}
              />
            ) : (
              <>
                <div className="inline-flex p-3 bg-[#f9f6f0] rounded-2xl text-[#d4af37] mb-4 shadow-sm">
                  <Lock size={32} />
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-1">ROSAMODA</h1>
              </>
            )}
            
            <p className="text-slate-500 text-sm mt-1">Inventory, Consignment, and Payment System</p>
            <p className="text-xs text-[#d4af37] font-semibold mt-2 uppercase tracking-wider">Please sign in</p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-3.5 bg-red-50 text-red-700 text-sm font-medium rounded-2xl border border-red-100 flex items-start gap-2.5">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleCustomLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Email Address</label>
              <input
                required
                type="email"
                className="w-full p-3.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#d4af37] outline-none text-sm transition-all"
                placeholder="name@gmail.com"
                value={loginInput.email}
                onChange={(e) => setLoginInput({...loginInput, email: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Password</label>
              <input
                required
                type="password"
                className="w-full p-3.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#d4af37] outline-none text-sm transition-all"
                placeholder="••••••••"
                value={loginInput.password}
                onChange={(e) => setLoginInput({...loginInput, password: e.target.value})}
              />
            </div>
            
            <button
              type="submit"
              className="w-full mt-2 py-3.5 bg-[#d4af37] hover:bg-[#c5a028] text-white rounded-xl font-bold transition-colors shadow-lg shadow-amber-900/20 text-sm"
            >
              Sign In to System
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">© {new Date().getFullYear()} Rosamoda. All rights reserved.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`min-h-screen bg-gray-50 text-slate-800 font-sans p-4 xl:p-8 ${printItems && printItems.length > 0 ? 'print:hidden' : ''}`}>
        <div className="w-full mx-auto space-y-6">
          
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
                {!logoError ? (
                  <img 
                    src="https://drive.google.com/thumbnail?id=1l9Q891y6gdH6vXnT-B9H3LlToKcagtmw&sz=w500" 
                    alt="Rosamoda Logo" 
                    className="h-10 md:h-12 w-auto object-contain drop-shadow-sm"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <Package className="text-[#d4af37]" size={32} />
                )}
                Inventory System
              </h1>
              <p className="text-gray-500 mt-1">Manage your luxury fashion inventory seamlessly</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${roleColor}`}>
                <span className={`w-2 h-2 rounded-full animate-pulse ${roleDot}`}></span>
                {roleText}
              </div>
              <div className="pl-2 border-l border-gray-300">
                <button onClick={handleLogout} className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 px-3.5 py-2 rounded-xl transition-colors font-semibold text-sm">
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </div>
          </header>

          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 border border-red-100">
              <AlertCircle size={20} />
              <p className="text-sm font-medium">{errorMsg}</p>
              <button onClick={() => setErrorMsg("")} className="ml-auto hover:text-red-800">
                <X size={16} />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="bg-slate-100 p-3 rounded-xl text-slate-800">
                <Tag size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Unique Items</p>
                <p className="text-2xl font-bold text-slate-900">{totalItems}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="bg-[#f9f6f0] p-3 rounded-xl text-[#d4af37]">
                <Package size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Active Stock (Status: In)</p>
                <p className="text-2xl font-bold text-slate-900">{totalStock} <span className="text-sm font-normal text-gray-400">pcs</span></p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="bg-slate-900 p-3 rounded-xl text-[#d4af37]">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Revenue (Sold Items)</p>
                <p className="text-xl md:text-2xl font-bold text-slate-900">{formatRupiah(totalRevenue)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            
            <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col xl:flex-row gap-4 justify-between items-center bg-gray-50/50">
              <div className="relative w-full xl:w-96">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="Search brand, name, category, or owner..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              
              <div className="flex flex-wrap w-full xl:w-auto gap-3">
                {selectedItems.length > 0 && currentEmail && (
                  <>
                    <button
                      onClick={() => {
                        const itemsToPrint = inventory.filter(i => selectedItems.includes(i.id));
                        setPrintItems(itemsToPrint);
                        setPrintType('IN');
                        setIsInvoiceMode(false);
                        setAttachmentImages([]);
                      }}
                      className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors bg-white text-slate-800 hover:bg-slate-50 border border-slate-200"
                    >
                      <Printer size={18} />
                      Print Document ({selectedItems.length})
                    </button>
                    
                    <button
                      onClick={() => {
                        const itemsToPrint = inventory.filter(i => selectedItems.includes(i.id));
                        setPrintItems(itemsToPrint);
                        setIsInvoiceMode(true);
                        setPaymentType('full');
                        setSelectedTermIndex('DP');
                        setAttachmentImages([]);
                      }}
                      className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors bg-[#d4af37] text-white hover:bg-[#c5a028] shadow-sm"
                    >
                      <FileText size={18} />
                      Create Invoice ({selectedItems.length})
                    </button>
                  </>
                )}

                {isAdmin && (
                  <button
                    onClick={exportToCSV}
                    className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-colors bg-slate-900 text-white hover:bg-black"
                  >
                    <Download size={20} />
                    Export Excel
                  </button>
                )}
                
                {canAdd && (
                  <button
                    onClick={() => setIsAdding(!isAdding)}
                    className={`flex-1 xl:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-colors ${
                      isAdding 
                        ? 'bg-slate-200 text-slate-800 hover:bg-slate-300' 
                        : 'bg-slate-900 text-white hover:bg-black shadow-sm'
                    }`}
                  >
                    {isAdding ? <X size={20} /> : <Plus size={20} />}
                    {isAdding ? 'Cancel' : 'Add New Item'}
                  </button>
                )}
              </div>
            </div>

            {isAdding && canAdd && (
              <div className="p-6 bg-[#f9f6f0] border-b border-[#e5d39e]">
                <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Date In</label>
                    <input required type="date" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] bg-white" value={newItem.date} onChange={(e) => setNewItem({...newItem, date: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Date Out</label>
                    <input type="date" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] bg-white text-gray-500" value={newItem.dateOut} onChange={(e) => setNewItem({...newItem, dateOut: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Item Code</label>
                    <div className="flex gap-2">
                      <input type="text" placeholder="Auto" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] bg-white uppercase" value={newItem.sku} onChange={(e) => setNewItem({...newItem, sku: e.target.value.toUpperCase()})} />
                      <button type="button" onClick={() => setNewItem({...newItem, sku: generateSKU(newItem.brand, newItem.category)})} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-2 py-2 rounded-lg transition-colors flex items-center justify-center shrink-0" title="Generate Code">
                        <Wand2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Brand</label>
                    <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] bg-white" value={newItem.brand} onChange={(e) => setNewItem({...newItem, brand: e.target.value})}>
                      {brands.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                    </select>
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Item Name</label>
                    <input required type="text" placeholder="e.g. Classic Flap Bag Medium" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37]" value={newItem.name} onChange={(e) => setNewItem({...newItem, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Category</label>
                    <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] bg-white" value={newItem.category} onChange={(e) => setNewItem({...newItem, category: e.target.value})}>
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Stock</label>
                    <input required type="number" min="0" placeholder="Qty" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37]" value={newItem.stock} onChange={(e) => setNewItem({...newItem, stock: e.target.value})} />
                  </div>
                  
                  {isAdmin && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Modal Price</label>
                      <input type="number" min="0" placeholder="10000000" className="w-full px-3 py-2 text-sm border border-slate-300 bg-slate-50 rounded-lg focus:ring-2 focus:ring-[#d4af37]" value={newItem.modalPrice} onChange={(e) => setNewItem({...newItem, modalPrice: e.target.value})} />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Selling Price</label>
                    <input required type="number" min="0" placeholder="15000000" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37]" value={newItem.price} onChange={(e) => setNewItem({...newItem, price: e.target.value})} />
                  </div>
                  
                  <div className="lg:col-span-2 grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Owner Name</label>
                      <input type="text" placeholder="Consignor Name" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37]" value={newItem.owner} onChange={(e) => setNewItem({...newItem, owner: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Owner Phone</label>
                      <input type="tel" placeholder="081234..." className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37]" value={newItem.ownerPhone} onChange={(e) => setNewItem({...newItem, ownerPhone: e.target.value})} />
                    </div>
                  </div>

                  <div className={isAdmin ? "" : "xl:col-span-2"}>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Status</label>
                    <div className="flex gap-2">
                      <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] bg-white" value={newItem.status} onChange={(e) => setNewItem({...newItem, status: e.target.value})}>
                        {statuses.map(stat => <option key={stat} value={stat}>{stat}</option>)}
                      </select>
                      <button type="submit" className="bg-slate-900 hover:bg-black text-white px-3 py-2 rounded-lg transition-colors flex items-center justify-center shrink-0">
                        <Save size={18} />
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
                <thead>
                  <tr className="bg-slate-50 border-b-2 border-slate-900 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="p-3 font-semibold text-center w-12">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
                        checked={selectedItems.length === filteredInventory.length && filteredInventory.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="p-3 font-semibold text-center w-12">#</th>
                    <th className="p-3 font-semibold">Date In</th>
                    <th className="p-3 font-semibold">Date Out</th>
                    <th className="p-3 font-semibold">Item Code</th>
                    <th className="p-3 font-semibold">Brand</th>
                    <th className="p-3 font-semibold">Item Name</th>
                    <th className="p-3 font-semibold">Category</th>
                    <th className="p-3 font-semibold text-center">Stock</th>
                    {isAdmin && <th className="p-3 font-semibold text-right text-slate-500">Modal Price</th>}
                    <th className="p-3 font-semibold text-right">Selling Price</th>
                    {isAdmin && <th className="p-3 font-semibold text-right text-slate-900">Profit</th>}
                    <th className="p-3 font-semibold">Owner Info</th>
                    <th className="p-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {currentItems.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? "14" : "12"} className="p-8 text-center text-gray-400">
                        {searchTerm ? 'No items found matching your search.' : 'No items in inventory. Click "Add New Item" to start.'}
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((item, index) => {
                      const absoluteIndex = indexOfFirstItem + index;
                      return (
                      <tr key={item.id} className={`hover:bg-slate-50 transition-colors group ${selectedItems.includes(item.id) ? 'bg-[#f9f6f0]/60' : ''}`}>
                        
                        {editingId === item.id && canEdit ? (
                          <>
                            <td className="p-3 text-center"></td>
                            <td className="p-3 text-center text-gray-400 font-medium">{absoluteIndex + 1}</td>
                            <td className="p-2">
                              <input type="date" className="w-32 p-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 text-xs" value={editFormData.date} onChange={(e) => setEditFormData({...editFormData, date: e.target.value})} />
                            </td>
                            <td className="p-2">
                              <input type="date" className="w-32 p-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 text-xs" value={editFormData.dateOut} onChange={(e) => setEditFormData({...editFormData, dateOut: e.target.value})} />
                            </td>
                            <td className="p-2">
                              <input type="text" className="w-28 p-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 text-xs uppercase" value={editFormData.sku} onChange={(e) => setEditFormData({...editFormData, sku: e.target.value.toUpperCase()})} placeholder="Code" />
                            </td>
                            <td className="p-2">
                              <select className="w-36 p-1.5 border border-slate-300 rounded text-xs" value={editFormData.brand} onChange={(e) => setEditFormData({...editFormData, brand: e.target.value})}>
                                {brands.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                              </select>
                            </td>
                            <td className="p-2">
                              <input type="text" className="w-48 p-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 text-xs" value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} />
                            </td>
                            <td className="p-2">
                              <select className="w-32 p-1.5 border border-slate-300 rounded text-xs" value={editFormData.category} onChange={(e) => setEditFormData({...editFormData, category: e.target.value})}>
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                              </select>
                            </td>
                            <td className="p-2">
                              <input type="number" min="0" className="w-16 p-1.5 border border-slate-300 rounded text-center block mx-auto text-xs" value={editFormData.stock} onChange={(e) => setEditFormData({...editFormData, stock: e.target.value})} />
                            </td>
                            
                            {isAdmin && (
                              <td className="p-2">
                                <input type="number" min="0" className="w-28 p-1.5 border border-slate-300 bg-slate-50 rounded text-right block ml-auto text-xs" value={editFormData.modalPrice} onChange={(e) => setEditFormData({...editFormData, modalPrice: e.target.value})} />
                              </td>
                            )}

                            <td className="p-2">
                              <input type="number" min="0" className="w-28 p-1.5 border border-slate-300 rounded text-right block ml-auto text-xs" value={editFormData.price} onChange={(e) => setEditFormData({...editFormData, price: e.target.value})} />
                            </td>
                            
                            {isAdmin && (
                              <td className="p-2 text-right text-xs font-bold text-slate-900 align-middle">
                                {formatRupiah((Number(editFormData.price) || 0) - (Number(editFormData.modalPrice) || 0))}
                              </td>
                            )}

                            <td className="p-2">
                              <div className="flex flex-col gap-1">
                                <input type="text" className="w-28 p-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 text-xs" value={editFormData.owner} onChange={(e) => setEditFormData({...editFormData, owner: e.target.value})} placeholder="Name" />
                                <input type="tel" className="w-28 p-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 text-xs" value={editFormData.ownerPhone} onChange={(e) => setEditFormData({...editFormData, ownerPhone: e.target.value})} placeholder="Phone" />
                              </div>
                            </td>
                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                <select className="w-32 p-1.5 border border-slate-300 rounded text-xs" value={editFormData.status} onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}>
                                  {statuses.map(stat => <option key={stat} value={stat}>{stat}</option>)}
                                </select>
                                <div className="flex items-center gap-1">
                                  <button onClick={() => saveEdit(item.id)} className="p-1 bg-[#d4af37] text-white hover:bg-[#c5a028] rounded" title="Save"><Save size={16} /></button>
                                  <button onClick={() => setEditingId(null)} className="p-1 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded" title="Cancel"><X size={16} /></button>
                                </div>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-3 text-center">
                              <input 
                                type="checkbox" 
                                className="rounded border-gray-300 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
                                checked={selectedItems.includes(item.id)}
                                onChange={() => handleSelect(item.id)}
                              />
                            </td>
                            <td className="p-3 text-center text-gray-400 font-medium">{absoluteIndex + 1}</td>
                            <td className="p-3 text-slate-600">{formatDateDisplay(item.date)}</td>
                            <td className="p-3 text-slate-600">{formatDateDisplay(item.dateOut)}</td>
                            <td className="p-3 font-mono text-xs font-bold text-[#b8952d]">{item.sku || '-'}</td>
                            <td className="p-3 font-medium text-slate-800">{item.brand}</td>
                            <td className="p-3 font-medium text-slate-900 max-w-xs truncate" title={item.name}>{item.name}</td>
                            <td className="p-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">{item.category}</span>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`font-semibold ${item.stock <= 0 ? 'text-red-500' : 'text-slate-700'}`}>{item.stock}</span>
                            </td>
                            
                            {isAdmin && (
                              <td className="p-3 text-right font-medium text-slate-500">
                                {formatRupiah(item.modalPrice)}
                              </td>
                            )}

                            <td className="p-3 text-right font-medium text-slate-700">
                              {formatRupiah(item.price)}
                            </td>
                            
                            {isAdmin && (
                              <td className="p-3 text-right font-bold text-slate-900">
                                {formatRupiah((Number(item.price) || 0) - (Number(item.modalPrice) || 0))}
                              </td>
                            )}

                            <td className="p-3">
                              <div className="flex flex-col">
                                <span className="text-slate-800 font-medium max-w-[120px] truncate" title={item.owner}>{item.owner || '-'}</span>
                                {isAdmin && item.ownerPhone && (
                                  <a 
                                    href={`https://wa.me/${item.ownerPhone.replace(/[^0-9]/g, '').replace(/^0/, '62')}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-[#d4af37] hover:text-[#c5a028] hover:underline mt-0.5"
                                    title="Chat via WhatsApp"
                                  >
                                    {item.ownerPhone}
                                  </a>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center justify-between min-w-[160px]">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(item.status)}`}>
                                  {item.status || 'In'}
                                </span>

                                <div className="flex items-center gap-1 opacity-100 xl:opacity-0 group-hover:opacity-100 transition-opacity">
                                  {currentEmail && (
                                    <>
                                      <button onClick={() => {
                                        setPrintItems([item]);
                                        setPrintType(item.status === 'In' ? 'IN' : 'OUT');
                                        setIsInvoiceMode(false);
                                        setAttachmentImages([]);
                                      }} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md" title="Print Document"><Printer size={16} /></button>
                                      
                                      <button onClick={() => {
                                        setPrintItems([item]);
                                        setIsInvoiceMode(true);
                                        setPaymentType('full');
                                        setSelectedTermIndex('DP');
                                        setAttachmentImages([]);
                                      }} className="p-1.5 text-[#d4af37] hover:bg-[#f9f6f0] rounded-md" title="Create Invoice"><FileText size={16} /></button>
                                    </>
                                  )}

                                  {canEdit && (
                                    <>
                                      <button onClick={() => startEdit(item)} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md" title="Edit Item"><Edit2 size={16} /></button>
                                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md" title="Delete Item"><Trash2 size={16} /></button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    );})
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="p-4 bg-white border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing <span className="font-semibold">{indexOfFirstItem + 1}</span> - <span className="font-semibold">{Math.min(indexOfLastItem, filteredInventory.length)}</span> of <span className="font-semibold">{filteredInventory.length}</span> entries
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-sm font-medium"
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>
                  <span className="text-sm font-semibold text-slate-700 px-3 py-1 bg-slate-100 rounded-lg">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-sm font-medium"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {printItems && printItems.length > 0 && !isInvoiceMode && (
        <div className="fixed inset-0 z-[100] bg-white overflow-y-auto print:static print:overflow-visible print:bg-white text-slate-800 font-sans">
          <div className="print:hidden sticky top-0 bg-white border-b border-slate-200 p-4 px-8 flex flex-wrap gap-4 items-center justify-between shadow-sm z-10">
            <div className="flex items-center gap-4">
              <button onClick={() => setPrintItems([])} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 font-medium">
                <X size={18} /> Close
              </button>
              <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
                <button onClick={() => setPrintType('IN')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${printType === 'IN' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'}`}>Consignment Receipt</button>
                <button onClick={() => setPrintType('OUT')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${printType === 'OUT' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'}`}>Consignment Return</button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 rounded-lg font-medium cursor-pointer transition-colors">
                <ImagePlus size={18} />
                <span>Upload Photos</span>
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
              </label>
              
              <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-2 bg-[#d4af37] text-white rounded-lg hover:bg-[#c5a028] font-bold transition-colors shadow-md">
                <Printer size={18} /> Print Document
              </button>
            </div>
          </div>

          <div className="max-w-5xl mx-auto bg-white p-8 md:p-12 text-slate-900 print:max-w-none print:w-full print:p-6 print:m-0">
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8 print:break-inside-avoid">
              <div className="flex flex-col items-start gap-4">
                {!logoError ? (
                  <img 
                    src="https://drive.google.com/thumbnail?id=1l9Q891y6gdH6vXnT-B9H3LlToKcagtmw&sz=w500" 
                    alt="Rosamoda Logo" 
                    className="h-16 md:h-20 print:h-20 print:w-auto print:max-w-[280px] w-auto object-contain object-left drop-shadow-sm print:drop-shadow-none -ml-1 print:ml-0 print:block"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div>
                    <h1 className="text-3xl font-black tracking-widest text-slate-900">ROSAMODA</h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">Luxury Fashion Consignment</p>
                  </div>
                )}

                <div className="flex flex-col gap-2.5 mt-2">
                  <div className="flex items-start gap-3 w-72 justify-start">
                    <div className="bg-[#d4af37] text-white p-1 rounded-full shrink-0 mt-0.5">
                      <MapPin size={14} strokeWidth={2.5} />
                    </div>
                    <span className="text-left font-serif text-[15px] leading-tight text-slate-800">
                      Melawai Plaza, Lt.1 No.232-G<br/>
                      Melawai, Keb.Baru. Jakarta Selatan
                    </span>
                  </div>
                  <div className="flex items-center gap-3 w-72 justify-start">
                    <div className="bg-[#d4af37] text-white p-1 rounded-full shrink-0">
                      <Phone size={14} strokeWidth={2.5} />
                    </div>
                    <span className="text-left font-serif text-[15px] text-slate-800">+6289 5603 858789</span>
                  </div>
                  <div className="flex items-center gap-3 w-72 justify-start">
                    <div className="bg-[#d4af37] text-white p-1 rounded-full shrink-0">
                      <Mail size={14} strokeWidth={2.5} />
                    </div>
                    <span className="text-left font-serif text-[15px] text-slate-800">elrosamoda@gmail.co.id</span>
                  </div>
                </div>
              </div>

              <div className="text-right flex flex-col items-end">
                <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-wide">
                  {printType === 'IN' ? 'CONSIGNMENT RECEIPT' : 'CONSIGNMENT RETURN'}
                </h2>
                <p className="text-sm text-slate-500 mt-1 mb-4">
                  Date: {formatDateDisplay(todayDate)}
                </p>
              </div>
            </div>

            <div className="mb-8 grid grid-cols-2 gap-8 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Owner Information</h3>
                <p className="text-lg font-bold text-slate-900">{printItems[0]?.owner || 'N/A'}</p>
                {isAdmin && (
                  <p className="text-slate-600 font-medium">{printItems[0]?.ownerPhone || '-'}</p>
                )}
              </div>
              <div className="text-right">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Total Items</h3>
                <p className="text-lg font-bold text-slate-900">{printItems.length} Pcs</p>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4 border-b-2 border-slate-200 pb-2">Item List</h3>
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <th className="p-3 font-semibold border-b border-slate-200 w-12">No</th>
                    <th className="p-3 font-semibold border-b border-slate-200">SKU</th>
                    <th className="p-3 font-semibold border-b border-slate-200">Item Name & Brand</th>
                    <th className="p-3 font-semibold border-b border-slate-200">Category</th>
                    <th className="p-3 font-semibold border-b border-slate-200 text-center">Date</th>
                    {isAdmin && <th className="p-3 font-semibold border-b border-slate-200 text-right">Modal Price</th>}
                    <th className="p-3 font-semibold border-b border-slate-200 text-right">Est. Selling Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {printItems.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="p-3 text-slate-500">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-[#b8952d]">{item.sku}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="text-xs text-slate-500">{item.brand}</div>
                      </td>
                      <td className="p-3 text-slate-600">{item.category}</td>
                      <td className="p-3 text-slate-600 text-center">
                        {printType === 'IN' ? formatDateDisplay(item.date) : formatDateDisplay(item.dateOut)}
                      </td>
                      {isAdmin && <td className="p-3 font-medium text-slate-500 text-right">{formatRupiah(item.modalPrice)}</td>}
                      <td className="p-3 font-medium text-slate-800 text-right">{formatRupiah(item.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mb-12">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4 border-b-2 border-slate-200 pb-2">Photo Attachments</h3>
              {attachmentImages.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {attachmentImages.map((imgSrc, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-lg p-2 flex items-center justify-center bg-slate-50 relative group">
                      <img src={imgSrc} alt={`Attachment ${idx+1}`} className="max-h-48 object-contain rounded" />
                      <button 
                        onClick={() => setAttachmentImages(prev => prev.filter((_, i) => i !== idx))}
                        className="print:hidden absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        title="Delete Photo"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full h-32 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center bg-gray-50 text-slate-400 print:border-solid print:h-48">
                  <span className="print:hidden">Click 'Upload Photos' above to attach multiple photos.</span>
                  <span className="hidden print:block text-slate-300">(Photo Attachments Area)</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-8 mt-16 pt-8 border-t border-slate-200 page-break-inside-avoid">
              <SignaturePad 
                title="Store Admin" 
                subtitle={currentEmail || 'Admin'} 
              />
              <SignaturePad 
                title="Consignor / Owner" 
                subtitle={printItems[0]?.owner || 'Owner'} 
                subtext={isAdmin ? (printItems[0]?.ownerPhone || '') : ''}
              />
            </div>
          </div>
        </div>
      )}

      {printItems && printItems.length > 0 && isInvoiceMode && (
        <div className="fixed inset-0 z-[100] bg-white overflow-y-auto print:static print:overflow-visible print:bg-white text-slate-800 font-sans">
          
          <div className="print:hidden sticky top-0 bg-white border-b border-slate-200 p-4 px-8 flex flex-wrap gap-4 items-center justify-between shadow-sm z-10">
            <div className="flex items-center gap-4">
              <button onClick={() => setPrintItems([])} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 font-medium">
                <X size={18} /> Close
              </button>
              
              <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
                <button 
                  onClick={() => { setPaymentType('full'); setSelectedTermIndex('DP'); }} 
                  className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors flex items-center gap-1.5 ${paymentType === 'full' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                >
                  <CreditCard size={16} /> 1. Full Payment
                </button>
                <button 
                  onClick={() => { setPaymentType('instalment'); setSelectedTermIndex('DP'); }} 
                  className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors flex items-center gap-1.5 ${paymentType === 'instalment' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                >
                  <Calendar size={16} /> 2. Instalment
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 rounded-lg font-medium cursor-pointer transition-colors">
                <ImagePlus size={18} />
                <span>Upload Photos</span>
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
              </label>
              
              <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-2 bg-[#d4af37] text-white rounded-lg hover:bg-[#c5a028] font-bold transition-colors shadow-md">
                <Printer size={18} /> Print Invoice
              </button>
            </div>
          </div>

          <div className="max-w-5xl mx-auto bg-white p-8 md:p-12 text-slate-900 print:max-w-none print:w-full print:p-6 print:m-0">
            
            <div className="print:hidden mb-8 bg-[#f9f6f0] p-5 rounded-xl border border-[#e5d39e] space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Customer Name</label>
                  <input 
                    type="text" 
                    placeholder="Full Customer Name" 
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#d4af37]"
                    value={invoiceDetails.buyerName}
                    onChange={(e) => setInvoiceDetails({...invoiceDetails, buyerName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone / WhatsApp</label>
                  <input 
                    type="tel" 
                    placeholder="08123456789" 
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#d4af37]"
                    value={invoiceDetails.buyerPhone}
                    onChange={(e) => setInvoiceDetails({...invoiceDetails, buyerPhone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Shipping Address</label>
                  <input 
                    type="text" 
                    placeholder="City / Short Address" 
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#d4af37]"
                    value={invoiceDetails.buyerAddress}
                    onChange={(e) => setInvoiceDetails({...invoiceDetails, buyerAddress: e.target.value})}
                  />
                </div>
              </div>

              {paymentType === 'instalment' && (
                <div className="pt-3 border-t border-[#e5d39e] grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Down Payment (DP) (Rp)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 2000000" 
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#d4af37]"
                      value={invoiceDetails.downPayment}
                      onChange={(e) => setInvoiceDetails({...invoiceDetails, downPayment: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tenor (Months)</label>
                    <select 
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#d4af37]"
                      value={invoiceDetails.tenorMonths}
                      onChange={(e) => setInvoiceDetails({...invoiceDetails, tenorMonths: e.target.value})}
                    >
                      <option value="2">2 Months</option>
                      <option value="3">3 Months</option>
                      <option value="6">6 Months</option>
                      <option value="12">12 Months</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">First Instalment Due Date</label>
                    <input 
                      type="date" 
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#d4af37]"
                      value={invoiceDetails.dueDateFirst}
                      onChange={(e) => setInvoiceDetails({...invoiceDetails, dueDateFirst: e.target.value})}
                    />
                  </div>
                  
                  <div className="md:col-span-3 bg-white p-3 rounded-lg border border-[#e5d39e] flex flex-col md:flex-row items-center justify-between gap-3">
                    <span className="text-xs font-bold uppercase text-slate-700">Select Term Invoice to Print:</span>
                    <div className="flex flex-wrap gap-2">
                      <button 
                        type="button" 
                        onClick={() => setSelectedTermIndex('DP')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${selectedTermIndex === 'DP' ? 'bg-[#d4af37] text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                      >
                        Down Payment (DP)
                      </button>
                      {Array.from({ length: parseInt(invoiceDetails.tenorMonths) || 3 }).map((_, idx) => (
                        <button 
                          key={idx}
                          type="button" 
                          onClick={() => setSelectedTermIndex(idx)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${selectedTermIndex === idx ? 'bg-[#d4af37] text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                        >
                          Instalment #{idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8 print:break-inside-avoid">
              <div className="flex flex-col items-start gap-4">
                {!logoError ? (
                  <img 
                    src="https://drive.google.com/thumbnail?id=1l9Q891y6gdH6vXnT-B9H3LlToKcagtmw&sz=w500" 
                    alt="Rosamoda Logo" 
                    className="h-16 md:h-20 print:h-20 print:w-auto print:max-w-[280px] w-auto object-contain object-left drop-shadow-sm print:drop-shadow-none -ml-1 print:ml-0 print:block"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div>
                    <h1 className="text-3xl font-black tracking-widest text-slate-900">ROSAMODA</h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">Luxury Fashion Consignment</p>
                  </div>
                )}

                <div className="flex flex-col gap-2.5 mt-2">
                  <div className="flex items-start gap-3 w-72 justify-start">
                    <div className="bg-[#d4af37] text-white p-1 rounded-full shrink-0 mt-0.5">
                      <MapPin size={14} strokeWidth={2.5} />
                    </div>
                    <span className="text-left font-serif text-[15px] leading-tight text-slate-800">
                      Melawai Plaza, Lt.1 No.232-G<br/>
                      Melawai, Keb.Baru. Jakarta Selatan
                    </span>
                  </div>
                  <div className="flex items-center gap-3 w-72 justify-start">
                    <div className="bg-[#d4af37] text-white p-1 rounded-full shrink-0">
                      <Phone size={14} strokeWidth={2.5} />
                    </div>
                    <span className="text-left font-serif text-[15px] text-slate-800">+6289 5603 858789</span>
                  </div>
                  <div className="flex items-center gap-3 w-72 justify-start">
                    <div className="bg-[#d4af37] text-white p-1 rounded-full shrink-0">
                      <Mail size={14} strokeWidth={2.5} />
                    </div>
                    <span className="text-left font-serif text-[15px] text-slate-800">elrosamoda@gmail.co.id</span>
                  </div>
                </div>
              </div>

              <div className="text-right flex flex-col items-end">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-wide">
                  {paymentType === 'full' ? 'SALES INVOICE' : (selectedTermIndex === 'DP' ? 'INVOICE - DOWN PAYMENT (DP)' : `INVOICE - INSTALMENT #${selectedTermIndex + 1}`)}
                </h2>
                <div className="mt-2 text-sm text-slate-600 space-y-0.5">
                  <p><span className="font-bold">Invoice No:</span> INV-{Date.now().toString().slice(-6)}-{paymentType === 'full' ? 'FULL' : (selectedTermIndex === 'DP' ? 'DP' : `C${selectedTermIndex + 1}`)}</p>
                  <p><span className="font-bold">Print Date:</span> {formatDateDisplay(todayDate)}</p>
                  <p><span className="font-bold">Payment Type:</span> <span className="uppercase text-[#d4af37] font-bold">{paymentType === 'full' ? 'Full Payment' : `Instalment (${invoiceDetails.tenorMonths} Months)`}</span></p>
                </div>
              </div>
            </div>

            <div className="mb-8 grid grid-cols-2 gap-8 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Billed To (Customer):</h3>
                <p className="text-base font-bold text-slate-900">{invoiceDetails.buyerName || '(Customer Name Not Provided)'}</p>
                <p className="text-sm text-slate-700">{invoiceDetails.buyerPhone || '-'}</p>
                <p className="text-sm text-slate-600">{invoiceDetails.buyerAddress || '-'}</p>
              </div>
              <div className="text-right">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Term Status</h3>
                <p className="text-base font-bold text-[#b8952d]">
                  {paymentType === 'full' ? 'PAID IN FULL' : (selectedTermIndex === 'DP' ? 'DOWN PAYMENT (DP)' : `INSTALMENT #${selectedTermIndex + 1} of ${invoiceDetails.tenorMonths}`)}
                </p>
                <p className="text-xs text-slate-500 mt-1">Authorized by Rosamoda Store</p>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4 border-b-2 border-slate-200 pb-2">Purchased Items</h3>
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <th className="p-3 font-semibold border-b border-slate-200 w-12">No</th>
                    <th className="p-3 font-semibold border-b border-slate-200">SKU</th>
                    <th className="p-3 font-semibold border-b border-slate-200">Item Name & Brand</th>
                    <th className="p-3 font-semibold border-b border-slate-200 text-center">Qty</th>
                    <th className="p-3 font-semibold border-b border-slate-200 text-right">Unit Price</th>
                    <th className="p-3 font-semibold border-b border-slate-200 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {printItems.map((item, idx) => {
                    const itemTotal = (Number(item.stock) || 1) * (Number(item.price) || 0);
                    return (
                      <tr key={item.id}>
                        <td className="p-3 text-slate-500">{idx + 1}</td>
                        <td className="p-3 font-mono font-bold text-[#b8952d]">{item.sku}</td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{item.name}</div>
                          <div className="text-xs text-slate-500">{item.brand} ({item.category})</div>
                        </td>
                        <td className="p-3 text-center text-slate-700 font-semibold">{item.stock || 1}</td>
                        <td className="p-3 text-right text-slate-700">{formatRupiah(item.price)}</td>
                        <td className="p-3 text-right font-bold text-slate-900">{formatRupiah(itemTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {(() => {
              const grandTotal = printItems.reduce((sum, item) => sum + ((Number(item.stock) || 1) * (Number(item.price) || 0)), 0);
              const dp = Number(invoiceDetails.downPayment) || 0;
              const tenor = parseInt(invoiceDetails.tenorMonths) || 3;
              const remainingBalance = Math.max(0, grandTotal - dp);
              const monthlyInstallment = Math.round(remainingBalance / tenor);

              let currentTermAmount = grandTotal;
              let currentDueDate = todayDate;

              if (paymentType === 'instalment') {
                if (selectedTermIndex === 'DP') {
                  currentTermAmount = dp;
                  currentDueDate = todayDate;
                } else {
                  currentTermAmount = monthlyInstallment;
                  currentDueDate = addMonthsToDateString(invoiceDetails.dueDateFirst, selectedTermIndex);
                }
              }

              return (
                <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Bank Account Information</h4>
                    <div className="text-sm text-slate-700 space-y-1">
                      <p><span className="font-bold">BCA Bank:</span> 5425-XXXX-XX (a.n. Elrosamoda)</p>
                      <p><span className="font-bold">Mandiri Bank:</span> 1270-XXXX-XX (a.n. Elrosamoda)</p>
                      <p className="text-xs text-slate-500 mt-2">Please attach transfer proof after payment is made.</p>
                    </div>

                    {paymentType === 'instalment' && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <p className="text-xs font-bold uppercase text-slate-600 mb-2">Instalment Schedule:</p>
                        <div className="space-y-1 text-xs text-slate-700">
                          <div className={`flex justify-between p-1.5 rounded ${selectedTermIndex === 'DP' ? 'bg-[#f9f6f0] font-bold text-[#b8952d]' : 'bg-white'}`}>
                            <span>Down Payment (DP):</span>
                            <span>{formatRupiah(dp)}</span>
                          </div>
                          {Array.from({ length: tenor }).map((_, idx) => {
                            const dueD = addMonthsToDateString(invoiceDetails.dueDateFirst, idx);
                            const isSelected = selectedTermIndex === idx;
                            return (
                              <div key={idx} className={`flex justify-between p-1.5 rounded ${isSelected ? 'bg-[#f9f6f0] font-bold text-[#b8952d]' : 'bg-white'}`}>
                                <span>Instalment #{idx + 1} ({formatDateDisplay(dueD)}):</span>
                                <span>{formatRupiah(monthlyInstallment)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-slate-600">
                        <span>Total Overall Purchase:</span>
                        <span className="font-bold text-slate-900">{formatRupiah(grandTotal)}</span>
                      </div>

                      {paymentType === 'instalment' && (
                        <>
                          <div className="flex justify-between text-slate-600">
                            <span>Down Payment (DP) Paid:</span>
                            <span className="font-medium text-slate-700">{formatRupiah(dp)}</span>
                          </div>
                          <div className="flex justify-between text-slate-600 pb-2 border-b border-slate-200">
                            <span>Remaining Balance:</span>
                            <span className="font-medium text-slate-700">{formatRupiah(remainingBalance)}</span>
                          </div>
                        </>
                      )}

                      <div className="bg-slate-900 p-4 rounded-xl mt-2 border border-slate-800 space-y-1">
                        <p className="text-xs font-bold uppercase text-slate-400">Current Term Due Amount:</p>
                        <div className="flex justify-between items-center text-base font-black text-white">
                          <span>{paymentType === 'full' ? 'Paid Amount:' : (selectedTermIndex === 'DP' ? 'DP Amount:' : `Instalment #${selectedTermIndex + 1} Amount:`)}</span>
                          <span className="text-lg text-[#d4af37]">{formatRupiah(currentTermAmount)}</span>
                        </div>
                        {paymentType === 'instalment' && (
                          <p className="text-xs font-semibold text-red-400 pt-1">
                            • Due Date: {formatDateDisplay(currentDueDate)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="mb-12">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4 border-b-2 border-slate-200 pb-2">Photo & Notes</h3>
              {attachmentImages.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {attachmentImages.map((imgSrc, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-lg p-2 flex items-center justify-center bg-slate-50 relative group">
                      <img src={imgSrc} alt={`Attachment ${idx+1}`} className="max-h-48 object-contain rounded" />
                      <button 
                        onClick={() => setAttachmentImages(prev => prev.filter((_, i) => i !== idx))}
                        className="print:hidden absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        title="Delete Photo"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full h-24 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center bg-gray-50 text-slate-400 print:border-solid print:h-32">
                  <span className="print:hidden">Click 'Upload Photos' above to attach receipt or transfer proof.</span>
                  <span className="hidden print:block text-slate-300">(Receipt / Transfer Proof Area)</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-8 mt-16 pt-8 border-t border-slate-200 page-break-inside-avoid">
              <SignaturePad 
                title="Store Authorized" 
                subtitle="Rosamoda Store" 
              />
              <SignaturePad 
                title="Customer / Buyer" 
                subtitle={invoiceDetails.buyerName || 'Customer Name'} 
                subtext={invoiceDetails.buyerPhone || ''}
              />
            </div>

          </div>
        </div>
      )}
    </>
  );
}
