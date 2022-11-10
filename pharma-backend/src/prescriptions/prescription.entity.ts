import { Column, Entity, ManyToOne, Relation } from 'typeorm';
import type { User } from '../authbroker/users';
import { Exclude } from 'class-transformer';
import { AbstractEntity } from '../common';

@Entity()
export class Prescription extends AbstractEntity {
    @Column()
    public amount: string;

    @ManyToOne('User', 'prescriptions')
    @Exclude()
    user!: Relation<User>;
}
