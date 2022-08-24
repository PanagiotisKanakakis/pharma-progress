import axios from 'axios';
import {TransactionEntity} from 'app/api/transaction/transaction.entity';
import {
    getAllTransactionsByAfmUrl, getSalesStatisticsByCriteriaUrl,
    getSubmitTransactionUrl,
    getTransactionsByCriteriaUrl,
    getUpdateTransactionUrl
} from './transaction.config';
import {CriteriaDto} from './dto';


export const submitTransactions = async (data: { transactions: TransactionEntity[] }, headers: any): Promise<any> => {
    const {data: response} = await axios.post(getSubmitTransactionUrl(), data, {headers: headers});
    return response;
};

export const updateTransactions = async (data: { transactions: TransactionEntity[] }, headers: any): Promise<any> => {
    const {data: response} = await axios.put(getUpdateTransactionUrl(), data, {headers: headers});
    return response;
};

export const getAllTransactionsByAfm = async (afm: string): Promise<any> => {
    const {data: response} = await axios.get(getAllTransactionsByAfmUrl(afm));
    return response;
};

export const getTransactionsByCriteria = async (criteria: CriteriaDto, headers: any): Promise<any> => {
    const {data: response} = await axios.get(
        getTransactionsByCriteriaUrl(),
        {
            headers: headers,
            params: criteria
        })
    return response;
};

export const getSalesStatisticsByCriteria = async (criteria: CriteriaDto, headers: any): Promise<any> => {
    const {data: response} = await axios.get(
        getSalesStatisticsByCriteriaUrl(),
        {
            headers: headers,
            params: criteria
        });
    return response;
};

