import {API_BASE_URL} from '../../common';

export const getChecksByCriteriaUrl = () => {
    return `${API_BASE_URL}/checks/getAllByCriteria`;
};

export const getSubmitChecksUrl = () => {
    return `${API_BASE_URL}/checks`;
};

export const getUpdateChecksUrl = () => {
    return `${API_BASE_URL}/checks`;
};