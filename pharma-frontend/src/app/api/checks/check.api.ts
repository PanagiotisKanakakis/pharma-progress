import axios from 'axios';
import {getChecksByCriteriaUrl, getSubmitChecksUrl, getUpdateChecksUrl} from './check.config';
import {CriteriaDto} from './dto/criteria.dto';
import {CheckEntity} from './check.entity';


export const getChecksByCriteria = async (criteria: CriteriaDto, headers: any): Promise<any> => {
    const {data: response} = await axios.get(
        getChecksByCriteriaUrl(),
        {
            headers: headers,
            params: criteria
        });
    return response;
};

export const submitChecks = async (check: CheckEntity, headers: any): Promise<any> => {
    const {data: response} = await axios.post(getSubmitChecksUrl(), check, {headers: headers});
    return response;
};

export const updateChecks = async (check: CheckEntity, headers: any): Promise<any> => {
    const {data: response} = await axios.put(getUpdateChecksUrl() + '/' + check.id, check, {headers: headers});
    return response;
};