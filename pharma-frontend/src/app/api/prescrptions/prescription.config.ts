import {API_BASE_URL} from '../../common';

export const getPrescriptionsByCriteriaUrl = () => {
    return `${API_BASE_URL}/prescription/getAllByCriteria`;
};

export const getSubmitPrescriptionsUrl = () => {
    return `${API_BASE_URL}/prescription`;
};

export const getUpdatePrescriptionsUrl = () => {
    return `${API_BASE_URL}/prescription`;
};