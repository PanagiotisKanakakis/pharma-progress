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
import type { User } from '../authbroker/users';
import { Exclude } from 'class-transformer';

@Entity()
export class Prescription {

    @PrimaryColumn()
    @Generated('increment')
    public id: number;

    @CreateDateColumn({ type: 'timestamp' })
    public createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    public updatedAt: Date;

    @Column()
    public amount: string;

    @Column()
    public comment: string;

    @ManyToOne('User', 'prescriptions')
    @Exclude()
    user!: Relation<User>;
}
