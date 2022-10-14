import {
    Column,
    CreateDateColumn,
    Entity,
    Generated,
    ManyToOne,
    PrimaryColumn,
    Relation,
    UpdateDateColumn,
} from 'typeorm';
import { VAT } from './enums';
import { TransactionType } from './enums';
import { PaymentType } from './enums';
import type { User } from '../authbroker/users';
import { Exclude } from 'class-transformer';
import { SupplierType } from './enums';

@Entity()
export class Transaction {
    @PrimaryColumn()
    @Generated('increment')
    public id: number;

    @CreateDateColumn({ type: 'timestamp' })
    public createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    public updatedAt: Date;

    @Column({
        type: 'enum',
        enum: TransactionType,
    })
    public transactionType: TransactionType;

    @Column({
        type: 'enum',
        enum: VAT,
    })
    public vat: VAT;

    @Column({
        type: 'enum',
        enum: PaymentType,
    })
    public paymentType: PaymentType;

    @Column({
        type: 'enum',
        enum: SupplierType,
    })
    public supplierType: SupplierType;

    @Column()
    public cost: string;

    @Column()
    public comment: string;

    @ManyToOne('User', 'transactions')
    @Exclude()
    user!: Relation<User>;
}
