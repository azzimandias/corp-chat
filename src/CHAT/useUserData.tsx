import { createContext, useContext, useState, useEffect } from 'react';
import { CSRF_TOKEN, PRODMODE } from '../config/config';
import { PROD_AXIOS_INSTANCE } from '../config/Api';
import { MS_USER } from './mock/msUserMock.ts';

const UserDataContext = createContext();

export const UserDataProvider = ({ children }) => {
    const [userdata, setUserdata] = useState(null);
    const [pageLoaded, setPageLoaded] = useState(false);

    const get_userdata = async () => {
        try {
            if (PRODMODE) {
                const response = await PROD_AXIOS_INSTANCE.get('/usda?_token=' + CSRF_TOKEN);
                console.log('response.data.user: ', response?.data || 'No data');
                setUserdata(response.data);
            } else {
                setUserdata(MS_USER);
            }
        } catch (e) {
            console.error('get_userdata error:', e);
        } finally {
            setPageLoaded(true);
        }
    };

    useEffect(() => {
        get_userdata();
    }, []);

    return (
        <UserDataContext.Provider value={{ userdata, setUserdata, pageLoaded }}>
    {children}
    </UserDataContext.Provider>
);
};

export const useUserData = () => useContext(UserDataContext);
