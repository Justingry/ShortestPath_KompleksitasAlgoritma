#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QMainWindow>
#include <QGraphicsScene>
#include <QGraphicsView>
#include <QTableWidget>
#include <QComboBox>
#include <QVector>
#include <QTimer>
#include <QGraphicsEllipseItem>

class RouterNode;
class CableEdge;

enum Mode { SELECT_MODE, ADD_ROUTER_MODE, ADD_CABLE_MODE };

class MainWindow : public QMainWindow {
    Q_OBJECT

public:
    explicit MainWindow(QWidget *parent = nullptr);

private slots:
    void onAddRouterClicked();
    void onAddCableClicked();
    void onRunDijkstraClicked();
    void onResetLogClicked();
    void onResetTopologyClicked();
    void onCanvasClicked(QPointF pos);
    void animatePacketStep();
    void onDeleteSelectedClicked();

private:
    void setupUI();
    void runDijkstra(int srcId, int destId);
    void removeRouter(RouterNode *router);
    void removeCable(CableEdge *cable);

    QGraphicsScene *m_scene;
    QGraphicsView *m_view;
    QTableWidget *m_logTable;
    QComboBox *m_comboSource;
    QComboBox *m_comboDest;

    Mode m_currentMode{SELECT_MODE};
    RouterNode *m_selectedSourceNode{nullptr};

    QVector<RouterNode*> m_routers;
    QVector<CableEdge*> m_edges;
    int m_routerIdCounter{0};

    // Animasi
    QTimer *m_animTimer;
    QGraphicsEllipseItem *m_packetItem{nullptr};
    QVector<QPointF> m_animPathPoints;
    int m_animStep{0};
};

#endif // MAINWINDOW_H