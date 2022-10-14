import {API_BASE_URL} from '../../common';
import {CriteriaDto} from './dto';

export const getSubmitTransactionUrl = () => {
    return `${API_BASE_URL}/transaction/commit`;
};

export const getUpdateTransactionUrl = () => {
    return `${API_BASE_URL}/transaction/update`;
};

export const getAllTransactionsByAfmUrl = (afm: string) => {
    return `${API_BASE_URL}/transaction/getAllByAfm/` + afm;
};

export const getTransactionsByCriteriaUrl = () => {
    return `${API_BASE_URL}/transaction/getAllTransactionsByCriteria`;
};

export const getSalesStatisticsByCriteriaUrl = () => {
    return `${API_BASE_URL}/statistics`;
};

