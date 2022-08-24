import {Column, Entity} from "typeorm";
import {AbstractEntity} from '../common';

@Entity()
export class File extends AbstractEntity {

    @Column()
    fileName: string;

    @Column()
    mimeType: string;

    @Column({
        type: 'bytea',
    })
    data: Uint8Array;

}
