import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateTasksTable1700000000002 implements MigrationInterface {
  name = 'CreateTasksTable1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'tasks',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'title', type: 'varchar', length: '200', isNullable: false },
          { name: 'description', type: 'varchar', isNullable: true },
          { name: 'status', type: 'varchar', default: `'TODO'`, isNullable: false },
          { name: 'priority', type: 'varchar', default: `'MEDIUM'`, isNullable: false },
          { name: 'dueDate', type: 'text', isNullable: true },
          { name: 'creatorId', type: 'uuid', isNullable: false },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'tasks',
      new TableForeignKey({
        columnNames: ['creatorId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('tasks');
    const fk = table?.foreignKeys.find((f) => f.columnNames.includes('creatorId'));
    if (fk) await queryRunner.dropForeignKey('tasks', fk);
    await queryRunner.dropTable('tasks');
  }
}
