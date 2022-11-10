import axios from 'axios';
import {TransactionEntity} from 'app/api/transaction/transaction.entity';
import {
    getAllTransactionsByAfmUrl, getSalesStatisticsByCriteriaUrl,
    getSubmitTransactionUrl,
    getTransactionsByCriteriaUrl,
    getUpdateTransactionUrl
} from './transaction.config';
import {CriteriaDto} from './dto';


export const submitTransaction = async (transaction: TransactionEntity, headers: any): Promise<any> => {
    const {data: response} = await axios.post(getSubmitTransactionUrl(), transaction, {headers: headers});
    return response;
};

export const updateTransaction = async (transaction: TransactionEntity, headers: any): Promise<any> => {
    const {data: response} = await axios.put(getUpdateTransactionUrl()+ '/'+transaction.id, transaction, {headers: headers});
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

