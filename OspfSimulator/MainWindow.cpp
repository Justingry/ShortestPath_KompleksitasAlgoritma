#include "MainWindow.h"
#include "RouterNode.h"
#include "CableEdge.h"

#include <QLabel>
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QToolBar>
#include <QHeaderView>
#include <QInputDialog>
#include <QMessageBox>
#include <QGraphicsSceneMouseEvent>
#include <queue>
#include <limits>
#include <algorithm>

// Custom QGraphicsScene untuk menangkap event klik
class InteractiveScene : public QGraphicsScene {
public:
    std::function<void(QPointF)> onClicked;
protected:
    void mousePressEvent(QGraphicsSceneMouseEvent *event) override {
        QGraphicsScene::mousePressEvent(event);
        if (event->button() == Qt::LeftButton && onClicked) {
            onClicked(event->scenePos());
        }
    }
};

MainWindow::MainWindow(QWidget *parent) : QMainWindow(parent) {
    setupUI();
    m_animTimer = new QTimer(this);
    connect(m_animTimer, &QTimer::timeout, this, &MainWindow::animatePacketStep);
}

void MainWindow::setupUI() {
    QWidget *centralWidget = new QWidget(this);
    QVBoxLayout *mainLayout = new QVBoxLayout(centralWidget);

    // --- Toolbar ---
    QToolBar *toolbar = addToolBar("Control Panel");
    QAction *actAddRouter = toolbar->addAction("Tambah Router");
    QAction *actAddCable = toolbar->addAction("Tambah Kabel");
    toolbar->addSeparator();

    toolbar->addWidget(new QLabel(" Source: "));
    m_comboSource = new QComboBox();
    toolbar->addWidget(m_comboSource);

    toolbar->addWidget(new QLabel(" Dest: "));
    m_comboDest = new QComboBox();
    toolbar->addWidget(m_comboDest);

    QAction *actRunDijkstra = toolbar->addAction("Jalankan Dijkstra");
    QAction *actResetLog = toolbar->addAction("Reset Log");
    QAction *actResetTopology = toolbar->addAction("Reset Topologi");
    QAction *actDeleteSelected = toolbar->addAction("Hapus Terpilih");

    connect(actDeleteSelected, &QAction::triggered, this, &MainWindow::onDeleteSelectedClicked);
    connect(actAddRouter, &QAction::triggered, this, &MainWindow::onAddRouterClicked);
    connect(actAddCable, &QAction::triggered, this, &MainWindow::onAddCableClicked);
    connect(actRunDijkstra, &QAction::triggered, this, &MainWindow::onRunDijkstraClicked);
    connect(actResetLog, &QAction::triggered, this, &MainWindow::onResetLogClicked);
    connect(actResetTopology, &QAction::triggered, this, &MainWindow::onResetTopologyClicked);
        
    // --- Workspace / Scene ---
    InteractiveScene *scene = new InteractiveScene();
    scene->onClicked = [this](QPointF pos) { onCanvasClicked(pos); };
    m_scene = scene;
    m_scene->setSceneRect(0, 0, 1000, 600);
    m_scene->setBackgroundBrush(QColor(245, 245, 245));

    m_view = new QGraphicsView(m_scene);
    m_view->setRenderHint(QPainter::Antialiasing);

    m_view = new QGraphicsView(m_scene);
    m_view->setRenderHint(QPainter::Antialiasing);
    m_view->setViewportUpdateMode(QGraphicsView::FullViewportUpdate);

    // --- Outcome / Log Panel ---
    m_logTable = new QTableWidget(0, 5);
    m_logTable->setHorizontalHeaderLabels({"Hop", "From", "To", "Bandwidth (Mbps)", "OSPF Cost"});
    m_logTable->horizontalHeader()->setSectionResizeMode(QHeaderView::Stretch);
    m_logTable->setMaximumHeight(180);

    mainLayout->addWidget(m_view, 1);
    mainLayout->addWidget(m_logTable);
    setCentralWidget(centralWidget);
}

void MainWindow::onAddRouterClicked() {
    m_currentMode = ADD_ROUTER_MODE;
    m_selectedSourceNode = nullptr;
}

void MainWindow::onAddCableClicked() {
    m_currentMode = ADD_CABLE_MODE;
    m_selectedSourceNode = nullptr;
}

void MainWindow::onCanvasClicked(QPointF pos) {
    if (m_currentMode == ADD_ROUTER_MODE) {
        int id = m_routerIdCounter++;
        QString name = QString("R%1").arg(id);
        RouterNode *router = new RouterNode(id, name);
        router->setPos(pos);
        
        m_scene->addItem(router);
        m_routers.append(router);

        m_comboSource->addItem(name, id);
        m_comboDest->addItem(name, id);

        m_currentMode = SELECT_MODE;
    } 
    else if (m_currentMode == ADD_CABLE_MODE) {
        QGraphicsItem *item = m_scene->itemAt(pos, QTransform());
        RouterNode *node = qgraphicsitem_cast<RouterNode*>(item);

        if (node) {
            if (!m_selectedSourceNode) {
                m_selectedSourceNode = node;
            } else if (m_selectedSourceNode != node) {
                bool ok;
                double bw = QInputDialog::getDouble(this, "Input Bandwidth", 
                                                    "Masukkan Bandwidth (Mbps):", 
                                                    100, 1, 10000, 1, &ok);
                if (ok) {
                    CableEdge *edge = new CableEdge(m_selectedSourceNode, node, bw);
                    m_scene->addItem(edge);
                    m_edges.append(edge);
                }
                m_selectedSourceNode = nullptr;
                m_currentMode = SELECT_MODE;
            }
        }
    }
}

void MainWindow::onRunDijkstraClicked() {
    if (m_comboSource->currentIndex() == -1 || m_comboDest->currentIndex() == -1) return;
    
    int srcId = m_comboSource->currentData().toInt();
    int destId = m_comboDest->currentData().toInt();

    // Reset visual highlight
    for (CableEdge *edge : m_edges) {
        edge->setHighlighted(false);
    }
    
    if (m_packetItem) {
        m_scene->removeItem(m_packetItem);
        delete m_packetItem;
        m_packetItem = nullptr;
    }

    runDijkstra(srcId, destId);
}

void MainWindow::runDijkstra(int srcId, int destId) {
    m_logTable->setRowCount(0);
    
    const double INF = std::numeric_limits<double>::infinity();
    int n = m_routers.size();
    
    std::vector<double> dist(n, INF);
    std::vector<int> parentNode(n, -1);
    std::vector<CableEdge*> parentEdge(n, nullptr);

    auto getRouterIndex = [this](int id) {
        for (int i = 0; i < m_routers.size(); ++i) {
            if (m_routers[i]->getId() == id) return i;
        }
        return -1;
    };

    int srcIdx = getRouterIndex(srcId);
    int destIdx = getRouterIndex(destId);

    if (srcIdx == -1 || destIdx == -1) return;

    using Pair = std::pair<double, int>; // {cost, node_index}
    std::priority_queue<Pair, std::vector<Pair>, std::greater<Pair>> pq;

    dist[srcIdx] = 0;
    pq.push({0, srcIdx});

    while (!pq.empty()) {
        auto [d, uIdx] = pq.top();
        pq.pop();

        if (d > dist[uIdx]) continue;
        
        RouterNode *uNode = m_routers[uIdx];
        if (uNode->getState() == RouterNode::DOWN) continue;

        for (CableEdge *edge : uNode->getEdges()) {
            if (edge->getStatus() == CableEdge::BROKEN) continue;

            RouterNode *vNode = (edge->getSource() == uNode) ? edge->getDest() : edge->getSource();
            if (vNode->getState() == RouterNode::DOWN) continue;

            int vIdx = getRouterIndex(vNode->getId());
            double weight = edge->getCost();

            if (dist[uIdx] + weight < dist[vIdx]) {
                dist[vIdx] = dist[uIdx] + weight;
                parentNode[vIdx] = uIdx;
                parentEdge[vIdx] = edge;
                pq.push({dist[vIdx], vIdx});
            }
        }
    }

    if (dist[destIdx] == INF) {
        QMessageBox::warning(this, "Hasil Dijkstra", "Jalur tidak ditemukan / Terputus!");
        return;
    }

    // Rekonstruksi Jalur
    QVector<CableEdge*> pathEdges;
    m_animPathPoints.clear();
    
    int curr = destIdx;
    m_animPathPoints.prepend(m_routers[curr]->pos());
    
    while (curr != srcIdx) {
        CableEdge *edge = parentEdge[curr];
        pathEdges.prepend(edge);
        edge->setHighlighted(true);

        curr = parentNode[curr];
        m_animPathPoints.prepend(m_routers[curr]->pos());
    }

    // Tampilkan pada Log Table
    double totalCost = 0;
    for (int i = 0; i < pathEdges.size(); ++i) {
        CableEdge *edge = pathEdges[i];
        int row = m_logTable->rowCount();
        m_logTable->insertRow(row);

        m_logTable->setItem(row, 0, new QTableWidgetItem(QString::number(i + 1)));
        m_logTable->setItem(row, 1, new QTableWidgetItem(edge->getSource()->getName()));
        m_logTable->setItem(row, 2, new QTableWidgetItem(edge->getDest()->getName()));
        m_logTable->setItem(row, 3, new QTableWidgetItem(QString::number(edge->getBandwidth())));
        m_logTable->setItem(row, 4, new QTableWidgetItem(QString::number(edge->getCost(), 'f', 1)));

        totalCost += edge->getCost();
    }

    int totalRow = m_logTable->rowCount();
    m_logTable->insertRow(totalRow);
    m_logTable->setItem(totalRow, 0, new QTableWidgetItem("TOTAL"));
    m_logTable->setItem(totalRow, 4, new QTableWidgetItem(QString::number(totalCost, 'f', 1)));

    // Inisialisasi Animasi Paket Data
    m_packetItem = m_scene->addEllipse(-6, -6, 12, 12, QPen(Qt::black), QBrush(Qt::yellow));
    m_packetItem->setZValue(3);
    m_packetItem->setPos(m_animPathPoints.first());
    
    m_animStep = 0;
    m_animTimer->start(20); // 20 ms per tick
}

void MainWindow::animatePacketStep() {
    if (m_animPathPoints.size() < 2 || m_animStep >= m_animPathPoints.size() - 1) {
        m_animTimer->stop();
        return;
    }

    QPointF start = m_packetItem->pos();
    QPointF target = m_animPathPoints[m_animStep + 1];

    QPointF dir = target - start;
    double length = std::hypot(dir.x(), dir.y());

    if (length < 3.0) {
        m_animStep++;
        if (m_animStep >= m_animPathPoints.size() - 1) {
            m_animTimer->stop();
        }
    } else {
        QPointF nextPos = start + (dir / length) * 3.0; // Kecepatan per tick
        m_packetItem->setPos(nextPos);
    }
}

void MainWindow::onResetLogClicked() {
    if (m_logTable) {
        m_logTable->setRowCount(0); // Menghapus seluruh baris di tabel log
    }
}

void MainWindow::onResetTopologyClicked() {
    // 1. Hapus semua item dari QGraphicsScene & memori C++
    if (m_scene) {
        m_scene->clear(); 
    }

    // 2. Kosongkan list pointer router dan kabel
    m_routers.clear();
    m_edges.clear();

    // 3. Reset dropdown pilihan Source & Dest
    if (m_comboSource) m_comboSource->clear();
    if (m_comboDest) m_comboDest->clear();

    // 4. Kosongkan juga tabel log
    if (m_logTable) m_logTable->setRowCount(0);

    // 5. Reset status variabel interaksi
    m_selectedSourceNode = nullptr;
    m_currentMode = SELECT_MODE;
}

void MainWindow::removeCable(CableEdge *cable) {
    if (!cable) return;

    if (cable->sourceNode()) cable->sourceNode()->removeEdge(cable);
    if (cable->destNode()) cable->destNode()->removeEdge(cable);

    m_edges.removeAll(cable);
    m_scene->removeItem(cable);
    delete cable;
}

void MainWindow::removeRouter(RouterNode *router) {
    if (!router) return;

    // 1. Hapus semua kabel yang terhubung ke router ini terlebih dahulu
    QVector<CableEdge*> edgesToDelete = m_edges;
    for (CableEdge *edge : edgesToDelete) {
        if (edge->sourceNode() == router || edge->destNode() == router) {
            removeCable(edge);
        }
    }

    // 2. Hapus router dari list m_routers
    m_routers.removeAll(router);

    // 3. Hapus nama router dari dropdown Source & Dest
    int idxSource = m_comboSource->findText(router->name());
    if (idxSource != -1) m_comboSource->removeItem(idxSource);

    int idxDest = m_comboDest->findText(router->name());
    if (idxDest != -1) m_comboDest->removeItem(idxDest);

    // 4. Hapus dari kanvas scene dan bebaskan memori
    m_scene->removeItem(router);
    delete router;
}

void MainWindow::onDeleteSelectedClicked() {
    // Ambil semua objek (router/kabel) yang sedang diklik/diseleksi di kanvas
    QList<QGraphicsItem*> selectedItems = m_scene->selectedItems();
    for (QGraphicsItem *item : selectedItems) {
        if (RouterNode *router = dynamic_cast<RouterNode*>(item)) {
            removeRouter(router);
        } else if (CableEdge *cable = dynamic_cast<CableEdge*>(item)) {
            removeCable(cable);
        }
    }
}