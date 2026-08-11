---
title: 'PV 操作与管程：解题模板与经典问题'
description: '多个进程同步'
pubDate: 2026-08-11
tags: ['操作系统', '并发']
---

## 同步和互斥

![Screenshot 2026-06-06 at 4.11.35 PM](/images/pv-管程/img-01.webp)

## 进程互斥的软件实现方法

![Screenshot 2026-06-06 at 4.16.05 PM](/images/pv-管程/img-02.webp)

## 进程互斥的硬件实现方法

![Screenshot 2026-06-06 at 4.28.20 PM](/images/pv-管程/img-03.webp)

## 信号量机制

### 信号量

![Screenshot 2026-06-06 at 4.35.15 PM](/images/pv-管程/img-04.webp)

#### 整型信号量

#### 记录型信号量

![Screenshot 2026-06-06 at 4.44.45 PM](/images/pv-管程/img-05.webp)

### 实现

![Screenshot 2026-06-06 at 4.53.36 PM](/images/pv-管程/img-06.webp)

#### 进程互斥

![Screenshot 2026-06-06 at 4.56.44 PM](/images/pv-管程/img-07.webp)

#### 进程同步

![Screenshot 2026-06-06 at 5.00.35 PM](/images/pv-管程/img-08.webp)

#### 进程的前驱关系

多个进程同步

![Screenshot 2026-06-06 at 5.04.02 PM](/images/pv-管程/img-09.webp)

### 解题套路

#### PV 解题模板

1. 先找互斥关系：凡是多个进程会同时访问同一个临界资源，就设置互斥信号量。

```
semaphore mutex = 1;

P(mutex);
{访问临界资源};
V(mutex);
```

2. 再找同步关系：凡是某个操作必须在另一个操作之后发生，就在前驱操作之后执行 `V`，在后继操作之前执行 `P`。

```
semaphore S = 0;

Process A() {
    {完成前驱操作};
    V(S);
}

Process B() {
    P(S);
    {执行后继操作};
}
```

3. 对数量型资源，用资源数初始化信号量。申请资源前 `P`，释放资源后 `V`。

```
semaphore resource = n;

P(resource);
{使用资源};
V(resource);
```

4. 对缓冲区问题，通常使用 `empty / full / mutex`。

```
semaphore empty = n;
semaphore full = 0;
semaphore mutex = 1;
```

生产者先申请空位，再互斥放入产品，最后增加产品数：

```
P(empty);
P(mutex);
{放入产品};
V(mutex);
V(full);
```

消费者先申请产品，再互斥取出产品，最后释放空位：

```
P(full);
P(mutex);
{取出产品};
V(mutex);
V(empty);
```

5. 对多类资源，分别设置对应的空位数和产品数。

例如苹果-橘子问题中：

```
semaphore empty = N;
semaphore apple = 0;
semaphore orange = 0;
```

6. 对批量资源，连续执行多次 `P` 或 `V`，并注意避免多个生产者各拿一部分资源后互相等待。必要时给批量申请过程加互斥。

```
P(p_mutex);
P(empty);
P(empty);
P(empty);
V(p_mutex);
```

#### 管程解题模板

管程的基本思路是：把共享状态和访问共享状态的操作封装在管程内部，由管程保证互斥进入。

```
TYPE M = monitor
    {共享变量};
    condition C;
    int C_count = 0;
    InterfaceModule IM;

    DEFINE operation;
    USE wait, signal, enter, leave;
```

写管程时一般按三步：

1. 用共享变量描述当前资源状态。

例如缓冲区问题用：

```
int count = 0;
```

读者-写者问题用：

```
int rc = 0;
int wc = 0;
```

哲学家问题用：

```
enum {THINKING, HUNGRY, EATING} state[5];
```

2. 条件不满足时，进入对应条件变量等待。

```
if (条件不满足) {
    wait(C, C_count, IM);
}
```

这里使用 Hoare 管程语义，`signal` 后被唤醒进程可以立即继续执行，因此可用 `if` 判断等待条件。

3. 改变共享状态后，检查是否可能让其他等待进程继续执行，必要时 `signal`。

```
{改变共享状态};

if (C_count > 0) {
    signal(C, C_count, IM);
}
```

#### PV 与管程的对应关系

PV 解法中，信号量通常直接表示资源或事件；管程解法中，资源状态通常由共享变量表示，等待队列由条件变量表示。

| PV 中的含义 | 管程中的对应写法 |
|---|---|
| `mutex` 保护临界区 | 管程天然互斥，使用 `enter/leave` |
| `empty/full` 表示资源数量 | 用 `count` 等共享变量记录状态 |
| `P(S)` 等待条件满足 | `if (条件不满足) wait(C)` |
| `V(S)` 唤醒等待者 | 状态改变后 `signal(C)` |
| 多类资源多个信号量 | 多个状态变量或多个条件变量 |

## 应用

### 严格交替同步

题目：在一个盒子里，混装了数量相等的黑白围棋子。现在用自动分拣系统把黑子、白子分开，设分拣系统有二个进程 P1 和 P2，其中 P1 拣白子，P2 拣黑子。规定每个进程每次拣一子；当一个进程在拣时，不允许另一个进程去拣；当一个进程拣了一子时，必须让另一个进程去拣。试分别使用 PV 操作和管程方法写出两进程 P1 和 P2 能并发正确执行的程序。

信号量+PV

```
semaphore turn_P1 = 1;
semaphore turn_P2 = 0;

void P1() {
    while (true) {
        P(turn_P1);
        {拣白子};
        V(turn_P2);
    }
}

void P2() {
    while (true) {
        P(turn_P2);
        {拣黑子};
        V(turn_P1);
    }
}
```

管程

```
TYPE SorterMonitor = monitor
    int turn = 1;
    condition wait_P1, wait_P2;
    int wait_P1_count = 0, wait_P2_count = 0;
    InterfaceModule IM;

    DEFINE pick_white, pick_black;
    USE wait, signal, enter, leave;

    void pick_white() {
        enter(IM);
        
        if (turn != 1) {
            wait(wait_P1, wait_P1_count, IM);
        }
        
        {拣白子};
        turn = 2;
        
        if (wait_P2_count > 0) {
            signal(wait_P2, wait_P2_count, IM);
        }
        
        leave(IM);
    }

    void pick_black() {
        enter(IM);
        
        if (turn != 2) {
            wait(wait_P2, wait_P2_count, IM);
        }
        
        {拣黑子};
        turn = 1;
        
        if (wait_P1_count > 0) {
            signal(wait_P1, wait_P1_count, IM);
        }
        
        leave(IM);
    }

SorterMonitor SM;

Process P1() {
    while (true) {
        SM.pick_white();
    }
}

Process P2() {
    while (true) {
        SM.pick_black();
    }
}
```

### 生产者-消费者

![Screenshot 2026-06-06 at 7.28.44 PM](/images/pv-管程/img-10.webp)

![Screenshot 2026-06-06 at 7.38.54 PM](/images/pv-管程/img-11.webp)

#### 基础

信号量+PV

```
semaphore mutex = 1;
semaphore empty = k;
semaphore full = 0;

void producer() {
    while (true) {
    		{生产产品};
        P(empty);
        P(mutex);
        {将产品放入缓冲区};
        V(mutex);
        V(full);
    }
}

void consumer() {
    while (true) {
        P(full);
        P(mutex);
        {从缓冲区取出产品};
        V(mutex);
        V(empty);
        {消费产品}；
    }
}
```

管程

```
TYPE ProducerConsumer = monitor
    int buffer[k];
    int in = 0, out = 0;
    int count = 0;
    condition empty, full;
    int empty_count = 0, full_count = 0;
    InterfaceModule IM;

    DEFINE append, remove;
    USE wait, signal, enter, leave;

    void append(int x) {
        enter(IM);

        if (count == k) {
            wait(full, full_count, IM);
        }

        buffer[in] = x;
        in = (in + 1) % k;
        count++;

        if (empty_count > 0) {
            signal(empty, empty_count, IM);
        }

        leave(IM);
    }

    void remove(int &x) {
        enter(IM);

        if (count == 0) {
            wait(empty, empty_count, IM);
        }

        x = buffer[out];
        out = (out + 1) % k;
        count--;

        if (full_count > 0) {
            signal(full, full_count, IM);
        }

        leave(IM);
    }

ProducerConsumer PC;

void Producer() {
    while (true) {
        int item;
        {生产一个产品 item};
        PC.append(item);
    }
}

void Consumer() {
    while (true) {
        int item;
        PC.remove(item);
        {消费产品 item};
    }
}
```

#### 多生产者-多消费者——苹果-橘子问题

![Screenshot 2026-06-06 at 7.46.51 PM](/images/pv-管程/img-12.webp)

![Screenshot 2026-06-06 at 7.48.42 PM](/images/pv-管程/img-13.webp)

信号量+PV

```
semaphore mutex = 1;
semaphore empty = N;
semaphore apple = 0;
semaphore orange = 0;

void father() {
    while (true) {
        {准备一个苹果};
        P(empty);
        P(mutex);
        {把苹果放入盘子};
        V(mutex);
        V(apple);
    }
}

void mother() {
    while (true) {
        {准备一个橘子};
        P(empty);
        P(mutex);
        {把橘子放入盘子};
        V(mutex);
        V(orange);
    }
}

void son() {
    while (true) {
        P(apple);
        P(mutex);
        {从盘子中取出一个苹果};
        V(mutex);
        V(empty);
        {吃苹果};
    }
}

void daughter() {
    while (true) {
        P(orange);
        P(mutex);
        {从盘子中取出一个橘子};
        V(mutex);
        V(empty);
        {吃橘子};
    }
}
```

管程

```
TYPE FruitPlate = monitor
    int apple_count = 0;
    int orange_count = 0;
    int total_count = 0;
    condition empty, full_apple, full_orange;
    int empty_count = 0;
    int apple_wait_count = 0;
    int orange_wait_count = 0;
    InterfaceModule IM;

    DEFINE put_apple, put_orange, get_apple, get_orange;
    USE wait, signal, enter, leave;

    void put_apple() {
        enter(IM);

        if (total_count == N) {
            wait(empty, empty_count, IM);
        }

        apple_count++;
        total_count++;

        if (apple_wait_count > 0) {
            signal(full_apple, apple_wait_count, IM);
        }

        leave(IM);
    }

    void put_orange() {
        enter(IM);

        if (total_count == N) {
            wait(empty, empty_count, IM);
        }

        orange_count++;
        total_count++;

        if (orange_wait_count > 0) {
            signal(full_orange, orange_wait_count, IM);
        }

        leave(IM);
    }

    void get_apple() {
        enter(IM);

        if (apple_count == 0) {
            wait(full_apple, apple_wait_count, IM);
        }

        apple_count--;
        total_count--;

        if (empty_count > 0) {
            signal(empty, empty_count, IM);
        }

        leave(IM);
    }

    void get_orange() {
        enter(IM);

        if (orange_count == 0) {
            wait(full_orange, orange_wait_count, IM);
        }

        orange_count--;
        total_count--;

        if (empty_count > 0) {
            signal(empty, empty_count, IM);
        }

        leave(IM);
    }

FruitPlate FP;

void father() {
    while (true) {
        {准备一个苹果};
        FP.put_apple();
    }
}

void mother() {
    while (true) {
        {准备一个橘子};
        FP.put_orange();
    }
}

void son() {
    while (true) {
        FP.get_apple();
        {吃苹果};
    }
}

void daughter() {
    while (true) {
        FP.get_orange();
        {吃橘子};
    }
}
```

#### 多资源组合——吸烟者问题

> 并不是完全意义上的生产者-消费者模型，更像是生产者-消费者+严格交替同步

![Screenshot 2026-06-09 at 11.52.10 AM](/images/pv-管程/img-14.webp)

信号量+PV

```
semaphore smoker[3] = {0, 0, 0};
semaphore finish = 1;

void Supplier() {
    while (true) {
        P(finish);
        
        int m1 = random_num() % 3; 
        int m2 = (m1 + (random_num() % 2 + 1)) % 3; 
        {放置材料 m1 和 m2};
        
        int missing = 3 - m1 - m2; 
        V(smoker[missing]); 
    }
}

void Smoker(int id) {
    while (true) {
        P(smoker[id]);
        {卷烟并抽烟};
        V(finish);
    }
}
```

管程

```
TYPE SmokerTable = monitor
    int current_missing = -1; 
    
    condition supplier_cond;
    int supplier_wait_count = 0;
    
    condition smoker_cond[3];
    int smoker_wait_count[3] = {0, 0, 0};
    
    InterfaceModule IM;

    DEFINE provide, take;
    USE wait, signal, enter, leave;

    void provide(int m1, int m2) {
        enter(IM);
        
        if (current_missing != -1) {
            wait(supplier_cond, supplier_wait_count, IM);
        }
        
        current_missing = 3 - m1 - m2; 
        
        if (smoker_wait_count[current_missing] > 0) {
            signal(smoker_cond[current_missing], smoker_wait_count[current_missing], IM);
        }
        
        leave(IM);
    }

    void take(int id) {
        enter(IM);
        
        if (current_missing != id) {
            wait(smoker_cond[id], smoker_wait_count[id], IM);
        }
        
        current_missing = -1; 
        
        if (supplier_wait_count > 0) {
            signal(supplier_cond, supplier_wait_count, IM);
        }
        
        leave(IM);
    }


SmokerTable ST;

void Supplier() {
    while (true) {
        int m1 = random_num() % 3; 
        int m2 = (m1 + (random_num() % 2 + 1)) % 3; 
        {准备材料 m1 和 m2};
        ST.provide(m1, m2);
    }
}

void Smoker(int id) {
    while (true) {
        ST.take(id);
        {卷烟并抽烟};
    }
}
```

#### 批量生产/消费

信号量+PV

```
int buffer[9];
int in = 0;
int out = 0;

semaphore mutex = 1;
semaphore empty = 9;
semaphore full = 0;
semaphore p_mutex = 1;

void producer() {
    while (true) {
        int a, b, c;
        {产生3个整数(a, b, c)};

        P(p_mutex);
        P(empty);
        P(empty);
        P(empty);
        V(p_mutex);

        P(mutex);
        buffer[in] = a; in = (in + 1) % 9;
        buffer[in] = b; in = (in + 1) % 9;
        buffer[in] = c; in = (in + 1) % 9;
        V(mutex);

        V(full);        
        V(full);
        V(full);
    }
}
void consumer() {
    while (true) {
        P(full);

        P(mutex);
        int item = buffer[out]; 
        out = (out + 1) % 9;
        V(mutex);

        V(empty);

        {消费整数 item};
    }
}
```

管程

```
TYPE ProducerConsumer = monitor
    int buffer[9];
    int in = 0, out = 0;
    int count = 0;
    condition empty, full;
    int empty_count = 0, full_count = 0;
    InterfaceModule IM;

    DEFINE append, remove;
    USE wait, signal, enter, leave;

    void append(int a, int b, int c) {
        enter(IM);

        if (count > 6) {
            wait(full, full_count, IM);
        }

        buffer[in] = a; in = (in + 1) % 9;
        buffer[in] = b; in = (in + 1) % 9;
        buffer[in] = c; in = (in + 1) % 9;
        count += 3;

        for (int i = 0; i < 3; i++) {
            if (empty_count > 0) {
                signal(empty, empty_count, IM);
            }
        }

        leave(IM);
    }
    
    void remove(int &x) {
        enter(IM);

        if (count == 0) {
            wait(empty, empty_count, IM);
        }

        x = buffer[out];
        out = (out + 1) % 9;
        count--;

        if (count <= 6 && full_count > 0) {
            signal(full, full_count, IM);
        }

        leave(IM);
    }

ProducerConsumer PC;

Process Producer() {
    while (true) {
        int a, b, c;
        {生产3个整数(a, b, c)}; 
        PC.append(a, b, c);
    }
}

Process Consumer() {
    while (true) {
        int x;
        PC.remove(x);
        {消费整数x};
    }
}
```

#### 多路供应装配

![Screenshot 2026-06-09 at 11.41.35 AM](/images/pv-管程/img-15.webp)

信号量+PV

```
semaphore mutex = 1;
semaphore empty_frame = N / 5;
semaphore empty_wheel = 4 * N / 5;
semaphore frame = 0;
semaphore wheel = 0;

void FrameProducer() {
    while (true) {
        {生产一个车架};
        P(empty_frame);
        P(mutex);
        {将车架放入槽};
        V(mutex);
        V(frame);
    }
}

void WheelProducer() {
    while (true) {
        {生产一个车轮};
        P(empty_wheel);
        P(mutex);
        {将车轮放入槽};
        V(mutex);
        V(wheel);
    }
}

void Assembler() {
    while (true) {
        P(frame);
        P(wheel);
        P(wheel);
        P(wheel);
        P(wheel);
        P(mutex);
        {取出一个车架和四个车轮拼成车};
        V(mutex);
        V(empty_frame);
        V(empty_wheel);
        V(empty_wheel);
        V(empty_wheel);
        V(empty_wheel);
    }
}
```

管程

```
TYPE CarFactory = monitor
    int frame_count = 0;
    int wheel_count = 0;

    condition empty_frame, empty_wheel, full_car;
    int emp_frame_cnt = 0, emp_wheel_cnt = 0, ful_car_cnt = 0;
    InterfaceModule IM;

    DEFINE put_frame, put_wheel, get_car;
    USE wait, signal, enter, leave;

    void put_frame() {
        enter(IM);
        if (frame_count == N / 5) {
            wait(empty_frame, emp_frame_cnt, IM);
        }
        frame_count++;
        if (frame_count >= 1 && wheel_count >= 4 && ful_car_cnt > 0) {
            signal(full_car, ful_car_cnt, IM);
        }
        leave(IM);
    }

    void put_wheel() {
        enter(IM);
        if (wheel_count == 4 * N / 5) {
            wait(empty_wheel, emp_wheel_cnt, IM);
        }
        wheel_count++;
        if (frame_count >= 1 && wheel_count >= 4 && ful_car_cnt > 0) {
            signal(full_car, ful_car_cnt, IM);
        }
        leave(IM);
    }

    void get_car() {
        enter(IM);
        if (frame_count < 1 || wheel_count < 4) {
            wait(full_car, ful_car_cnt, IM);
        }
        frame_count--;
        wheel_count -= 4;
        if (emp_frame_cnt > 0) {
            signal(empty_frame, emp_frame_cnt, IM);
        }
        for (int i = 0; i < 4; i++) {
            if (emp_wheel_cnt > 0) {
                signal(empty_wheel, emp_wheel_cnt, IM);
            }
        }
        leave(IM);
    }

CarFactory CF;

void FrameProducer() {
    while (true) {
        {生产一个车架};
        CF.put_frame();
    }
}

void WheelProducer() {
    while (true) {
        {生产一个车轮};
        CF.put_wheel();
    }
}

void Assembler() {
    while (true) {
        CF.get_car();
        {取出一个车架和四个车轮拼成车};
    }
}
```

#### 动态差值受限

![Screenshot 2026-06-09 at 11.54.21 AM](/images/pv-管程/img-16.webp)

信号量+PV

```
semaphore mutex = 1;
semaphore empty_A = m;
semaphore empty_B = m;
semaphore full_A = 0;
semaphore full_B = 0;
semaphore A_lead = n; 
semaphore B_lead = n; 

void SupplierA() {
    while (true) {
        produce_A();
        P(empty_A);
        P(A_lead); 
        P(mutex);
        put_A_to_warehouse();
        V(mutex);
        V(full_A);
        V(B_lead); 
    }
}

void SupplierB() {
    while (true) {
        produce_B();
        P(empty_B);
        P(B_lead); 
        P(mutex);
        put_B_to_warehouse();
        V(mutex);
        V(full_B);
        V(A_lead); 
    }
}

void Consumer() {
    while (true) {
        P(full_A);
        P(full_B);
        P(mutex);
        get_A_and_B_from_warehouse();
        V(mutex);
        V(empty_A);
        V(empty_B);
        consume_and_assemble();
    }
}
```

管程

```
TYPE BoundedDiffWarehouse = monitor
    int count_A = 0;
    int count_B = 0;

    condition cond_A, cond_B, cond_consumer;
    int wait_A_cnt = 0, wait_B_cnt = 0, wait_con_cnt = 0;
    InterfaceModule IM;

    DEFINE put_A, put_B, get_pair;
    USE wait, signal, enter, leave;

    void put_A() {
        enter(IM);
        if (count_A == m || count_A - count_B == n) {
            wait(cond_A, wait_A_cnt, IM);
        }
        count_A++;
        if (count_A >= 1 && count_B >= 1 && wait_con_cnt > 0) {
            signal(cond_consumer, wait_con_cnt, IM);
        }
        if (count_B < m && count_B - count_A < n && wait_B_cnt > 0) {
            signal(cond_B, wait_B_cnt, IM);
        }
        leave(IM);
    }

    void put_B() {
        enter(IM);
        if (count_B == m || count_B - count_A == n) {
            wait(cond_B, wait_B_cnt, IM);
        }
        count_B++;
        if (count_A >= 1 && count_B >= 1 && wait_con_cnt > 0) {
            signal(cond_consumer, wait_con_cnt, IM);
        }
        if (count_A < m && count_A - count_B < n && wait_A_cnt > 0) {
            signal(cond_A, wait_A_cnt, IM);
        }
        leave(IM);
    }

    void get_pair() {
        enter(IM);
        if (count_A < 1 || count_B < 1) {
            wait(cond_consumer, wait_con_cnt, IM);
        }
        count_A--;
        count_B--;
        if (count_A < m && count_A - count_B < n && wait_A_cnt > 0) {
            signal(cond_A, wait_A_cnt, IM);
        }
        if (count_B < m && count_B - count_A < n && wait_B_cnt > 0) {
            signal(cond_B, wait_B_cnt, IM);
        }
        leave(IM);
    }

BoundedDiffWarehouse BDW;

void SupplierA() {
    while (true) {
        produce_A();
        BDW.put_A();
    }
}

void SupplierB() {
    while (true) {
        produce_B();
        BDW.put_B();
    }
}

void Consumer() {
    while (true) {
        BDW.get_pair();
        consume_and_assemble();
    }
}
```

#### 多级流水线串联

![Screenshot 2026-06-08 at 8.02.25 PM](/images/pv-管程/img-17.webp)

信号量+PV

```
semaphore mutex[4] = {1, 1, 1, 1};
semaphore empty[4] = {0, 3, 2, 2};
semaphore full[4] = {3, 0, 0, 0};
int in[4]  = {0, 0, 0, 0};
int out[4] = {0, 0, 0, 0};
int capacity[4] = {3, 3, 2, 2};

void Pi(int i) {
    while (true) {
        P(full[i]);
        P(mutex[i]);
        {从信箱 Mi[out[i]] 中取出 1 条消息};
        out[i] = (out[i] + 1) % capacity[i];
        V(mutex[i]);
        V(empty[i]);

        {加工消息};
        int next = (i + 1) % 4;
        P(empty[next]);
        P(mutex[next]);
        {将加工后的消息放入信箱 Mnext[in[next]]};
        in[next] = (in[next] + 1) % capacity[next];
        V(mutex[next]);
        V(full[next]);
    }
}
```

管程

```
TYPE RingMailbox = monitor
    int buffer[4][3];
    int capacity[4] = {3, 3, 2, 2};
    int count[4]    = {3, 0, 0, 0};
    int in[4]       = {0, 0, 0, 0};
    int out[4]      = {0, 0, 0, 0};

    condition empty[4], full[4];
    int empty_count[4] = {0, 0, 0, 0};
    int full_count[4]  = {0, 0, 0, 0};
    InterfaceModule IM;

    DEFINE append, remove;
    USE wait, signal, enter, leave;

    void append(int box_id, int x) {
        enter(IM);

        if (count[box_id] == capacity[box_id]) {
            wait(full[box_id], full_count[box_id], IM);
        }

        buffer[box_id][in[box_id]] = x;
        in[box_id] = (in[box_id] + 1) % capacity[box_id];
        count[box_id]++;

        if (empty_count[box_id] > 0) {
            signal(empty[box_id], empty_count[box_id], IM);
        }

        leave(IM);
    }

    void remove(int box_id, int &x) {
        enter(IM);

        if (count[box_id] == 0) {
            wait(empty[box_id], empty_count[box_id], IM);
        }

        x = buffer[box_id][out[box_id]];
        out[box_id] = (out[box_id] + 1) % capacity[box_id];
        count[box_id]--;

        if (full_count[box_id] > 0) {
            signal(full[box_id], full_count[box_id], IM);
        }

        leave(IM);
    }

RingMailbox RM;

void Pi(int i) {
    int msg;
    
    while (true) {
        RM.remove(i, msg);
        
        {加工消息 msg};
        
        int next = (i + 1) % 4;
        RM.append(next, msg);
    }
}
```

### 读者-写者

![Screenshot 2026-06-07 at 3.44.46 PM](/images/pv-管程/img-18.webp)

读者共享，写写互斥，读写互斥

#### 读者优先

信号量+PV

```
int readcount = 0;
semaphore rmutex = 1;
semaphore rwmutex = 1;

void reader() {
    while (true) {
        P(rmutex);
        if (readcount == 0) {
            P(rwmutex);
        }
        readcount++;
        V(rmutex);

        {执行读操作};

        P(rmutex);
        readcount--;
        if (readcount == 0) {
            V(rwmutex);
        }
        V(rmutex);
    }
}

void writer() {
    while (true) {
        P(rwmutex);

        {执行写操作};

        V(rwmutex);
    }
}
```

管程

```
TYPE ReaderWriter = monitor
    int rc = 0;
    int wc = 0;
    
    condition R, W;
    int R_count = 0, W_count = 0;
    InterfaceModule IM;

    DEFINE start_read, end_read, start_write, end_write;
    USE wait, signal, enter, leave;

    void start_read() {
        enter(IM);

        rc++;
        if (wc > 0) {
            wait(R, R_count, IM);
        }
        
        if (R_count > 0) {
            signal(R, R_count, IM);
        }

        leave(IM);
    }

    void end_read() {
        enter(IM);
        
        rc--;
        if (rc == 0 && W_count > 0) {
            signal(W, W_count, IM);
        }

        leave(IM);
    }

    void start_write() {
        enter(IM);

        if (rc > 0 || wc > 0) {
            wait(W, W_count, IM);
        }
        wc++;

        leave(IM);
    }

    void end_write() {
        enter(IM);

        wc--;
        if (R_count > 0) {
            signal(R, R_count, IM);
        } else if (W_count > 0) {
            signal(W, W_count, IM);
        }

        leave(IM);
    }

ReaderWriter RW;

void Reader() {
    while (true) {
        RW.start_read();
        {执行读操作};
        RW.end_read();
    }
}

void Writer() {
    while (true) {
        RW.start_write();
        {执行写操作};
        RW.end_write();
    }
}
```

#### 写者优先

信号量+PV

```
int readcount = 0;
int writecount = 0;
semaphore rmutex = 1;
semaphore wmutex = 1;
semaphore rwmutex = 1;
semaphore w_first = 1;

void reader() {
    while (true) {
        P(w_first);
        P(rmutex);
        if (readcount == 0) {
            P(rwmutex);
        }
        readcount++;
        V(rmutex);
        V(w_first);

        {执行读操作};

        P(rmutex);
        readcount--;
        if (readcount == 0) {
            V(rwmutex);
        }
        V(rmutex);
    }
}

void writer() {
    while (true) {
        P(wmutex);
        if (writecount == 0) {
            P(w_first);
        }
        writecount++;
        V(wmutex);

        P(rwmutex);
        
        {执行写操作};
        
        V(rwmutex);

        P(wmutex);
        writecount--;
        if (writecount == 0) {
            V(w_first);
        }
        V(wmutex);
    }
}
```

管程

```
TYPE ReaderWriter = monitor
    int rc = 0;
    int wc = 0;
    
    condition R, W;
    int R_count = 0, W_count = 0;
    InterfaceModule IM;

    DEFINE start_read, end_read, start_write, end_write;
    USE wait, signal, enter, leave;

    void start_read() {
        enter(IM);

        if (wc > 0) {
            wait(R, R_count, IM);
        }
        rc++;
        
        if (R_count > 0) {
            signal(R, R_count, IM);
        }

        leave(IM);
    }

    void end_read() {
        enter(IM);
        
        rc--;
        if (rc == 0 && W_count > 0) {
            signal(W, W_count, IM);
        }

        leave(IM);
    }

    void start_write() {
        enter(IM);

        wc++;
        if (rc > 0 || wc > 1) {
            wait(W, W_count, IM);
        }

        leave(IM);
    }

    void end_write() {
        enter(IM);

        wc--;
        if (W_count > 0) {
            signal(W, W_count, IM);
        } else if (R_count > 0) {
            signal(R, R_count, IM);
        }

        leave(IM);
    }

ReaderWriter RW;

void Reader() {
    while (true) {
        RW.start_read();
        {执行读操作};
        RW.end_read();
    }
}

void Writer() {
    while (true) {
        RW.start_write();
        {执行写操作};
        RW.end_write();
    }
}
```

#### 读写公平

信号量+PV

```
int readcount = 0;
semaphore rmutex = 1;
semaphore rwmutex = 1;
semaphore queue = 1;

void reader() {
    while (true) {
        P(queue);
        P(rmutex);
        if (readcount == 0) {
            P(rwmutex);
        }
        readcount++;
        V(rmutex);
        V(queue);

        {执行读操作};

        P(rmutex);
        readcount--;
        if (readcount == 0) {
            V(rwmutex);
        }
        V(rmutex);
    }
}

void writer() {
    while (true) {
        P(queue);
        P(rwmutex);
        V(queue);

        {执行写操作};

        V(rwmutex);
    }
}
```

### 容量限制+互斥

信号量+PV

```
semaphore capacity = N; 
semaphore mutex = 1;   

void process() {
    while (true) {
        P(capacity);
        
        P(mutex);
        {在互斥资源上进行登记/占用操作};
        V(mutex);
        
        {执行耗时的核心业务};
        
        P(mutex);
        {在互斥资源上进行注销/释放操作};
        V(mutex);
        
        V(capacity);
    }
}
```

管程

```
TYPE CapacityMonitor = monitor
    int empty_count = N;
    condition available;
    int wait_count = 0;
    InterfaceModule IM;

    DEFINE enter_system, leave_system;
    USE wait, signal, enter, leave;

    void enter_system() {
        enter(IM);

        if (empty_count == 0) {
            wait(available, wait_count, IM);
        }

        empty_count--;
        {在互斥资源上进行登记/占用操作};

        leave(IM);
    }

    void leave_system() {
        enter(IM);

        {在互斥资源上进行注销/释放操作};
        empty_count++;

        if (wait_count > 0) {
            signal(available, wait_count, IM);
        }

        leave(IM);
    }
```

### 哲学家就餐

信号量+PV

1 是筷子可用，0 是筷子已被占用

```
semaphore chopstick[5] = {1, 1, 1, 1, 1};
semaphore count = 4;

void philosopher(int i) {
    while (true) {
        {思考};
        
        P(count);
        P(chopstick[i]);
        P(chopstick[(i + 1) % 5]);
        
        {进餐};
        
        V(chopstick[i]);
        V(chopstick[(i + 1) % 5]);
        V(count);
    }
}
```

管程

```
TYPE philosopher_monitor = monitor
    enum {THINKING, HUNGRY, EATING} state[5] = {THINKING, THINKING, THINKING, THINKING, THINKING};
    condition self[5];
    int self_count[5] = {0, 0, 0, 0, 0};
    InterfaceModule IM;

    DEFINE pickup, putdown;
    USE wait, signal, enter, leave;

    void test(int k) {
        if ((state[(k + 4) % 5] != EATING) && 
            (state[k] == HUNGRY) &&
            (state[(k + 1) % 5] != EATING)) {

            state[k] = EATING;
            if (self_count[k] > 0) {
                signal(self[k], self_count[k], IM);
            }
        }
    }

    void pickup(int i) {
        enter(IM);

        state[i] = HUNGRY;
        test(i);
        if (state[i] != EATING) {
            wait(self[i], self_count[i], IM);
        }

        leave(IM);
    }

    void putdown(int i) {
        enter(IM);

        state[i] = THINKING;
        test((i + 4) % 5);
        test((i + 1) % 5);

        leave(IM);
    }

Process Philosopher_i() {
    while (true) {
        {思考};
        pickup(i);
        {进餐};
        putdown(i);
    }
}
```
