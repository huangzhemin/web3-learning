-- 开始事务
BEGIN TRANSACTION;

-- 声明变量用于存储账户A的余额
DECLARE @balance_A DECIMAL(10, 2);

-- 查询账户A的余额
SELECT @balance_A = balance 
FROM accounts 
WHERE id = 'A';

-- 检查账户A的余额是否足够
IF @balance_A >= 100 THEN
    -- 从账户A扣除100元
    UPDATE accounts 
    SET balance = balance - 100 
    WHERE id = 'A';
    
    -- 向账户B增加100元
    UPDATE accounts 
    SET balance = balance + 100 
    WHERE id = 'B';
    
    -- 在transactions表中记录该笔转账信息
    INSERT INTO transactions (from_account_id, to_account_id, amount) 
    VALUES ('A', 'B', 100);
    
    -- 提交事务
    COMMIT TRANSACTION;
ELSE
    -- 余额不足，回滚事务
    ROLLBACK TRANSACTION;
END IF;