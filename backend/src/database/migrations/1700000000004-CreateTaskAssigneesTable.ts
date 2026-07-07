import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateTaskAssigneesTable1700000000004 implements MigrationInterface {
  name = 'CreateTaskAssigneesTable1700000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'task_assignees',
        columns: [
          { name: 'taskId', type: 'uuid', isPrimary: true, isNullable: false },
          { name: 'userId', type: 'uuid', isPrimary: true, isNullable: false },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'task_assignees',
      new TableForeignKey({
        columnNames: ['taskId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tasks',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'task_assignees',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('task_assignees');
    if (table) {
      for (const fk of table.foreignKeys) {
        await queryRunner.dropForeignKey('task_assignees', fk);
      }
    }
    await queryRunner.dropTable('task_assignees');
  }
}
