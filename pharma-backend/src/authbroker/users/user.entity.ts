import { AbstractEntity } from '../../common';
import { Entity, Column, Index, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Transaction } from '../../transaction';
import { OpeningBalance } from '../../opening-balance';

@Entity({ name: 'users' })
export class User extends AbstractEntity {
    @Index()
    @Column({ unique: true, nullable: true })
    @Exclude()
    public keycloakId: string;

    @Index()
    @Column({ unique: true })
    public afm: string;

    @Index()
    @Column({ unique: true })
    public username: string;

    @Column({ nullable: true })
    @Exclude()
    public email: string;

    @Column({ nullable: true })
    public firstName: string;

    @Column({ nullable: true })
    public lastName: string;

    @Column({ nullable: true })
    public businessType: string;

    @OneToMany(() => Transaction, (transaction) => transaction.user)
    @Exclude()
    public transactions: Transaction[];

    @OneToMany(() => OpeningBalance, (openingBalance) => openingBalance.user, {
        cascade: ['insert', 'update'],
    })
    @Exclude()
    public openingBalances: OpeningBalance[];
}
