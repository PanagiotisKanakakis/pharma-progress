import {
    Column,
    CreateDateColumn,
    Entity,
    Generated,
    ManyToOne,
    PrimaryColumn,
    UpdateDateColumn,
} from 'typeorm';
import { VAT } from './enums';
import { TransactionType } from './enums';
import { PaymentType } from './enums';
import { User } from '../authbroker';
import { Exclude } from 'class-transformer';
import { SupplierType } from './enums/supplier-type.enum';

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

    @ManyToOne(() => User, (user) => user.transactions)
    @Exclude()
    user!: User;
}
