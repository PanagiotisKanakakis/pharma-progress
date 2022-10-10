import { Column, Entity, ManyToOne, Relation } from 'typeorm';
import type { User } from '../authbroker/users';
import { Exclude } from 'class-transformer';
import { AbstractEntity } from '../common';

@Entity()
export class OpeningBalance extends AbstractEntity {
    @Column()
    public value: string;

    @ManyToOne('User', 'openingBalances')
    @Exclude()
    user!: Relation<User>;
}
