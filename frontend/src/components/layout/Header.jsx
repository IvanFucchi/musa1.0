import React from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {useAuth} from '@/context/AuthContext';
import LocationSearchMap from '../common/LocationSearchMap';
import SearchBar from '../search/SearchBar';
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,} from "@/components/ui/dropdown-menu"
import {UserCircleIcon} from '@heroicons/react/24/solid'
import SearchForm from '@/components/layout/SearchForm';

export default function Header({handleTextSearch, handleLocationSearch}) {
  const {isAuthenticated, user, logout} = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearchQuery = (query) => {
    if (handleTextSearch && query && query.query) {
      handleTextSearch(query.query);
    }
  };

  return (
    <header className='sticky py-4 top-0 bg-white border-b z-20'>
      <div className="container grid grid-cols-12 gap-4 items-center">
        <div className="col-span-6 md:col-span-3 xl:col-span-4">
          <Link to="/" className="flex items-center gap-3 w-fit">
            <img
              className='w-[36px]'
              src="/images/logo.svg"
              alt="MUSA"/>
            <span className="text-3xl font-semibold">MUSA</span>
          </Link>
        </div>
        <div className="col-span-12 md:col-span-6 xl:col-span-4 order-last md:order-none">
          <SearchForm/>
          {/*
          <SearchBar onSearch={handleSearchQuery}/>
          <LocationSearchMap onSearch={handleLocationSearch}/>
          */}
        </div>
        <div className='col-span-6 md:col-span-3 xl:col-span-4 flex justify-end items-center'>
          <ul className={"flex items-center space-x-3 lg:space-x-6"}>
            <li className='hidden lg:block'>
              <Link to="/">Home</Link>
            </li>
            <li className='hidden lg:block'>
              <Link to="/explore">Esplora</Link>
            </li>
            {!isAuthenticated &&
              <li>
                <Link to="/login">Accedi</Link>
              </li>
            }
            {isAuthenticated &&
              <li>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <UserCircleIcon className="size-6"/>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 mt-3 bg-white">
                    {user.role === 'admin' && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin">Dashboard</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>
                      <Link to="/profile">Profilo</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            }
          </ul>
        </div>
      </div>
    </header>
  );
}
