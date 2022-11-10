import { Exclude } from 'class-transformer';
import {
    CreateDateColumn,
    PrimaryColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

export abstract class AbstractEntity {
    @PrimaryGeneratedColumn()
    public id: number;

    @PrimaryColumn()
    @CreateDateColumn({ type: 'timestamp' })
    @Exclude()
    public createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    @Exclude()
    public updatedAt: Date;
}
