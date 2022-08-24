import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentType, TransactionType, VAT } from '../enums';

export class CommitTransactionDto {
    @IsNotEmpty()
    @ApiProperty({ isArray: true })
    transactions: [
        {
            id: number;
            transactionType: TransactionType;
            vat: VAT;
            paymentType: PaymentType;
            createdAt: Date;
            cost: any;
            supplierType: number;
            comment: string;
            userId: string;
        },
    ];
}
