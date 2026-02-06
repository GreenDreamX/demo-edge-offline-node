import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'https://www.emsifa.com/api-wilayah-indonesia/api';

export interface Area {
    id: string;
    name: string;
}

export const useWilayah = () => {
    const [provinces, setProvinces] = useState<Area[]>([]);
    const [regencies, setRegencies] = useState<Area[]>([]);
    const [districts, setDistricts] = useState<Area[]>([]);
    const [villages, setVillages] = useState<Area[]>([]);

    const [loading, setLoading] = useState(false);

    // Fetch Provinces on Load
    useEffect(() => {
        const fetchProvinces = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`${API_BASE}/provinces.json`);
                setProvinces(res.data);
            } catch (error) {
                console.error("Failed to fetch provinces", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProvinces();
    }, []);

    const fetchRegencies = async (provinceId: string) => {
        if (!provinceId) {
            setRegencies([]);
            return;
        }
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/regencies/${provinceId}.json`);
            setRegencies(res.data);
            setDistricts([]);
            setVillages([]);
        } catch (error) {
            console.error("Failed to fetch regencies", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDistricts = async (regencyId: string) => {
        if (!regencyId) {
            setDistricts([]);
            return;
        }
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/districts/${regencyId}.json`);
            setDistricts(res.data);
            setVillages([]);
        } catch (error) {
            console.error("Failed to fetch districts", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchVillages = async (districtId: string) => {
        if (!districtId) {
            setVillages([]);
            return;
        }
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/villages/${districtId}.json`);
            setVillages(res.data);
        } catch (error) {
            console.error("Failed to fetch villages", error);
        } finally {
            setLoading(false);
        }
    };

    return {
        provinces,
        regencies,
        districts,
        villages,
        fetchRegencies,
        fetchDistricts,
        fetchVillages,
        loading
    };
};
