import axios from 'axios';
import {CriteriaDto} from './dto/criteria.dto';
import {PrescriptionEntity} from './prescription.entity';
import {getPrescriptionsByCriteriaUrl, getSubmitPrescriptionsUrl, getUpdatePrescriptionsUrl} from './prescription.config';


export const getPrescriptionsByCriteria = async (criteria: CriteriaDto, headers: any): Promise<any> => {
    const {data: response} = await axios.get(
        getPrescriptionsByCriteriaUrl(),
        {
            headers: headers,
            params: criteria
        });
    return response;
};

export const submitPrescription = async (prescription: PrescriptionEntity, headers: any): Promise<any> => {
    const {data: response} = await axios.post(getSubmitPrescriptionsUrl(), prescription, {headers: headers});
    return response;
};

export const updatePrescription = async (prescription: PrescriptionEntity, headers: any): Promise<any> => {
    const {data: response} = await axios.put(getUpdatePrescriptionsUrl() + '/' + prescription.id, prescription, {headers: headers});
    return response;
};