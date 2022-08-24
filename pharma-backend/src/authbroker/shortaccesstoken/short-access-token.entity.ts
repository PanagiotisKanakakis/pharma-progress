import { AbstractEntity } from '../../common/entities/abstract.entity';
import { Entity, Column, Generated, Index } from 'typeorm';
import { PermissionTypes, ResourceTypes } from '../interfaces';

@Entity({ name: 'shortaccesstoken' })
@Index(['token', 'resourceType'], { unique: true })
export class ShortAccessTokenEntity extends AbstractEntity {
    @Column({
        type: 'enum',
        enum: ResourceTypes,
    })
    public resourceType: ResourceTypes;

    @Column()
    public resourceId: string;

    @Column({
        type: 'enum',
        enum: PermissionTypes,
    })
    public permission: PermissionTypes;

    @Column()
    public duration: string;

    @Column({ type: 'uuid' })
    @Generated('uuid')
    public token: string;
}
