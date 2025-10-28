import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('prescriptions')
export class Prescription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  csvId!: string;

  @Column()
  date!: string;

  @Column({ length: 11 })
  patientCpf!: string;

  @Column()
  doctorCrm!: string;

  @Column({ length: 2 })
  doctorUf!: string;

  @Column()
  medication!: string;

  @Column({ default: false })
  controlled!: boolean;

  @Column()
  dosage!: string;

  @Column()
  frequency!: string;

  @Column('int')
  duration!: number;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}
