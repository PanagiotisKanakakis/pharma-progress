import { Column, Entity, ManyToOne, Relation } from 'typeorm';
import type { User } from '../authbroker/users';
import { Exclude } from 'class-transformer';
import { AbstractEntity } from '../common';

@Entity()
export class Check extends AbstractEntity {
    @Column({ type: 'timestamp' })
    public purchasedAt: Date;

    @Column({ type: 'timestamp' })
    public expiredAt: Date;

    @Column()
    public cost: string;

    @Column()
    public company: string;

    @Column()
    public comment: string;

    @ManyToOne('User', 'checks')
    @Exclude()
    user!: Relation<User>;
}
