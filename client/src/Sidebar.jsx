import { useState } from "react";
import { HomeIcon, ChartBarIcon, UserIcon } from "@heroicons/react/outline";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className={`sidebar ${isOpen ? "w-64" : "w-20"} transition-all duration-300`}>
      <button className="toggle-btn" onClick={() => setIsOpen(!isOpen)}>
        ☰
      </button>
      <ul>
        <li>
          <HomeIcon className="icon" /> {isOpen && "Home"}
        </li>
        <li>
          <ChartBarIcon className="icon" /> {isOpen && "Insights"}
        </li>
        <li>
          <UserIcon className="icon" /> {isOpen && "Profile"}
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
